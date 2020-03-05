import React from 'react';
import {registry} from '@jahia/ui-extender';
import {useHistory} from 'react-router-dom';
import {PrimaryNavItem} from '@jahia/moonstone';
import {useTranslation} from 'react-i18next';
import Feather from '@jahia/moonstone/dist/icons/Feather';
import PageComposer from './PageComposer';
import {useSelector} from 'react-redux';
import {pageComposerActions} from './PageComposer.actions';

const PATH = '/page-composer';

export const PageComposerGroup = () => {
    const {t} = useTranslation();
    const history = useHistory();
    const current = useSelector(state => ({language: state.language, site: state.site}));
    if (current.site === 'systemsite') {
        return null;
    }

    return (
        <PrimaryNavItem
            role="page-composer-menu-item"
            isSelected={history.location.pathname.startsWith(PATH)}
            icon={<Feather/>}
            label={t('jahia-ui-root:primaryNavigation.pageComposer.label')}
            onClick={() => history.push(PATH)}/>
    );
};

registry.add('primary-nav-item', 'pageComposerNavGroup', {
    targets: ['nav-root-top:1'],
    render: () => <PageComposerGroup/>
});

// Register wiokrflow component
registry.add('route', 'pageComposerNavGroup', {
    targets: ['nav-root-top'],
    path: PATH,
    defaultPath: PATH,
    render: () => <PageComposer/>
});

pageComposerActions(registry);
