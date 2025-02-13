import React from 'react';
import pageComposerAction from './actions/PageComposerAction';
import {OpenInBrowser} from '@jahia/moonstone/dist/icons';

export const pageComposerActions = registry => {
    registry.add('action', 'pageComposer', pageComposerAction, {
        buttonLabel: 'jcontent:label.contentManager.actions.pageComposer',
        buttonIcon: <OpenInBrowser/>,
        // Target just before contentActionsSeparator3 in jContent
        targets: ['narrowHeaderMenu:49', 'browseControlBar:49', 'contentItemActions:49', 'contentItemContextActions:49']
    });
};
