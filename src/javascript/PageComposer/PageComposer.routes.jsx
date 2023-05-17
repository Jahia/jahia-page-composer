import React from 'react';
import {useHistory} from 'react-router-dom';
import {PrimaryNavItem} from '@jahia/moonstone';
import {useTranslation} from 'react-i18next';
import JContent from '@jahia/moonstone/dist/icons/JContent';
import PageComposer from './PageComposer';
import {useSelector} from 'react-redux';

const PATH = '/page-composer';

export const PageComposerItem = props => {
    const {t} = useTranslation('jahia-page-composer');
    const history = useHistory();
    const current = useSelector(state => ({language: state.language, site: state.site}));
    if (current.site === 'systemsite') {
        return null;
    }

    return (
        <PrimaryNavItem
            {...props}
            isSelected={history.location.pathname.startsWith(PATH)}
            icon={<JContent/>}
            label={t('jahia-page-composer:label')}
            onClick={() => history.push(PATH)}/>
    );
};

export const pageComposerRoutes = registry => {
    registry.add('primary-nav-item', 'page-composer', {
        targets: ['nav-root-top:1'],
        requiredPermission: 'pageComposerAccess',
        render: () => <PageComposerItem/>
    });

    registry.add('route', 'pageComposerRoute', {
        targets: ['main'],
        path: PATH,
        defaultPath: PATH,
        requiredPermission: 'pageComposerAccess',
        render: () => registry.get('route', 'requireCoreLicenseRoot').render() || <PageComposer/>
    });
};
