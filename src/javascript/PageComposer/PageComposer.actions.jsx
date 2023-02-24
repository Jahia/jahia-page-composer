import React from 'react';
import pageComposerAction from './actions/PageComposerAction';
import {OpenInBrowser} from '@jahia/moonstone/dist/icons';

export const pageComposerActions = registry => {
    registry.add('action', 'pageComposer', pageComposerAction, {
        buttonLabel: 'jcontent:label.contentManager.actions.pageComposer',
        buttonIcon: <OpenInBrowser/>,
        targets: ['contentActions:11', 'narrowHeaderMenu:10.5']
    });
};
