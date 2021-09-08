import React from 'react';
import {Button, Typography} from '@jahia/moonstone';
import PropTypes from 'prop-types';
import {useTranslation} from 'react-i18next';
export const ErrorPage = ({onClick}) => {
    const {t} = useTranslation('jahia-page-composer');

    return (
        <div className="flexFluid flexCol_center alignCenter">
            <div style={{margin: 'var(--spacing-medium)'}}>
                <Typography variant="heading">{t('errorTitle')}</Typography>
            </div>
            <div style={{
                margin: 'var(--spacing-medium)',
                textAlign: 'center'
            }}
            >
                <Typography>{t('errorContent1')}<br/>{t('errorContent2')}</Typography>
            </div>
            <div style={{margin: 'var(--spacing-medium)'}}>
                <Button isDisabled={!onClick}
                        label={t('backToHome')}
                        color="accent"
                        size="big"
                        onClick={onClick}
                />
            </div>
        </div>
    );
};

ErrorPage.propTypes = {
    onClick: PropTypes.func
};
