import React from 'react';
import {useNodeChecks} from '@jahia/data-helper';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';

const PATH_CONTENTS_AND_DESCENDANTS = '^/sites/((?!/).)+/contents(/(.+)?)?';
const PATH_FILES_AND_DESCENDANTS = '^/sites/((?!/).)+/files(/(.+)?)?';
const PATH_SYSTEM_SITE_AND_DESCENDANTS = '^/sites/systemsite(/(.+)?)?';

export const PageComposerAction = ({context, render: Render, loading: Loading}) => {
    const {language} = useSelector(state => ({language: state.language}));
    const res = useNodeChecks(
        {path: context.path},
        {
            requiredPermission: ['editModeAccess'],
            getDisplayableNodePath: true,
            hideForPaths: [PATH_FILES_AND_DESCENDANTS, PATH_CONTENTS_AND_DESCENDANTS, PATH_SYSTEM_SITE_AND_DESCENDANTS],
            ...context
        }
    );

    if (res.loading && Loading) {
        return <Loading context={context}/>;
    }

    if (!res.node) {
        return false;
    }

    return (
        <Render context={{
            ...context,
            isVisible: res.checksResult,
            enabled: res.checksResult,
            onClick: () => {
                window.open(window.contextJsParameters.contextPath + '/cms/edit/default/' + language + res.node.displayableNode.path + '.html', '_blank');
            }
        }}/>
    );
};

PageComposerAction.propTypes = {
    context: PropTypes.object.isRequired,
    render: PropTypes.func.isRequired,
    loading: PropTypes.func
};

const pageComposerAction = {
    component: PageComposerAction
};

export default pageComposerAction;
