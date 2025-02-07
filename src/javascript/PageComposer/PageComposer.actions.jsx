import React from 'react';
import pageComposerAction from './actions/PageComposerAction';
import {OpenInBrowser} from '@jahia/moonstone/dist/icons';

export const pageComposerActions = registry => {
    registry.add('action', 'pageComposer', pageComposerAction, {
        buttonLabel: 'jcontent:label.contentManager.actions.pageComposer',
        buttonIcon: <OpenInBrowser/>,
        targets: ['narrowHeaderMenu:10.5', 'browseControlBar:12', 'contentItemActions:21', 'contentItemContextActions:22']
    });
};
