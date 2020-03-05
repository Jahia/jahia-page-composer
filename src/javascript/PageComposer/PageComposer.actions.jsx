import React from 'react';
import pageComposerAction from './actions/PageComposerAction';
import {OpenInBrowser} from '@jahia/moonstone/dist/icons';

const PATH_CONTENTS_AND_DESCENDANTS = '^/sites/((?!/).)+/contents/?';
const PATH_FILES_AND_DESCENDANTS = '^/sites/((?!/).)+/files/?';
const PATH_SYSTEM_SITE_AND_DESCENDANTS = '^/sites/systemsite/?';

export const pageComposerActions = registry => {
    registry.add('action', 'pageComposer', pageComposerAction, {
        buttonLabel: 'jcontent:label.contentManager.actions.pageComposer',
        buttonIcon: <OpenInBrowser/>,
        targets: ['contentActions'],
        hideForPaths: [PATH_FILES_AND_DESCENDANTS, PATH_CONTENTS_AND_DESCENDANTS, PATH_SYSTEM_SITE_AND_DESCENDANTS]
    });
};
