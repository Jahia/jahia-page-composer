import React from 'react';
import {useNodeChecks} from '@jahia/data-helper';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';

export const PageComposerAction = ({context, render: Render, loading: Loading}) => {
    const {language} = useSelector(state => ({language: state.language}));
    const res = useNodeChecks(
        {path: context.path},
        {
            showOnNodeTypes: ['jnt:page', 'jmix:editorialContent', 'jnt:content'],
            requiredPermission: ['editModeAccess'],
            getDisplayableNodePath: true
        }
    );

    if (res.loading && Loading) {
        return <Loading context={context}/>;
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
