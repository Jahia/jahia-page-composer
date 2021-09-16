import React from 'react';
import {Button, Typography} from '@jahia/moonstone';
import PropTypes from 'prop-types';
import {useTranslation} from 'react-i18next';
import styles from './ErrorPage.scss';
import clsx from 'clsx';

export const ErrorPage = ({onClick}) => {
    const {t} = useTranslation('jahia-page-composer');

    return (
        <div className={styles.page404}>
            <div className={clsx(styles['page404-wrapper'], 'flexCol', 'alignCenter')}>
                <Typography component="h1"
                            variant="title"
                            weight="bold"
                            className={styles['page404-title']}
                >{t('errorTitle')}
                </Typography>
                <Typography variant="subtitle" className={styles['page404-description']}>{t('errorContent1')}</Typography>
                <Typography variant="subtitle" className={styles['page404-description']}>{t('errorContent2')}</Typography>
                <Button isDisabled={!onClick}
                        label={t('backToHome')}
                        color="accent"
                        size="big"
                        className={styles['page404-button']}
                        onClick={onClick}
                />
            </div>
        </div>
    );
};

ErrorPage.propTypes = {
    onClick: PropTypes.func
};
