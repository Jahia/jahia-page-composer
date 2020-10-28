import React from 'react';
import {useNodeChecks} from '@jahia/data-helper';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';

const PATH_CONTENTS_AND_DESCENDANTS = '^/sites/((?!/).)+/contents(/(.+)?)?';
const PATH_FILES_AND_DESCENDANTS = '^/sites/((?!/).)+/files(/(.+)?)?';
const PATH_SYSTEM_SITE_AND_DESCENDANTS = '^/sites/systemsite(/(.+)?)?';

export const PageComposerAction = ({path, render: Render, loading: Loading, ...others}) => {
    const {language} = useSelector(state => ({language: state.language}));
    const res = useNodeChecks(
        {path},
        {
            requiredPermission: ['jContentAccess'],
            getDisplayableNodePath: true,
            hideOnNodeTypes: ['jnt:navMenuText'],
            hideForPaths: [PATH_FILES_AND_DESCENDANTS, PATH_CONTENTS_AND_DESCENDANTS, PATH_SYSTEM_SITE_AND_DESCENDANTS]
        }
    );

    if (res.loading && Loading) {
        return <Loading {...others}/>;
    }

    if (!res.node) {
        return false;
    }

    return (
        <Render {...others}
                isVisible={res.checksResult}
                enabled={res.checksResult}
                onClick={() => {
                    window.open(window.contextJsParameters.contextPath + '/cms/edit/default/' + language + res.node.displayableNode.path + '.html', '_blank');
                }}
        />
    );
};

PageComposerAction.propTypes = {
    path: PropTypes.string.isRequired,
    render: PropTypes.func.isRequired,
    loading: PropTypes.func
};

const pageComposerAction = {
    component: PageComposerAction
};

export default pageComposerAction;
