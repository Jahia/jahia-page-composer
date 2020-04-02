import {createActions, handleActions} from 'redux-actions';
import {batch} from 'react-redux';
import {registry} from '@jahia/ui-extender';

export const {pcSetPath} = createActions('PC_SET_PATH');

const extractParamsFromUrl = pathname => {
    if (pathname.startsWith('/page-composer/')) {
        let [, , , language, , site, ...pathElements] = pathname.split('/');

        let path = ('/' + pathElements.join('/'));

        path = decodeURIComponent(path);
        return {site, language, path};
    }

    return {site: '', language: '', path: ''};
};

const select = state => {
    let {router: {location: {pathname}}, site, language, pagecomposer: {path}} = state;
    return {
        pathname,
        site,
        language,
        path
    };
};

let currentValue;
let getSyncListener = store => () => {
    setTimeout(() => {
        let previousValue = currentValue || {};
        currentValue = select(store.getState());
        if (currentValue.pathname.startsWith('/page-composer/')) {
            let currentValueFromUrl = extractParamsFromUrl(currentValue.pathname);
            if (previousValue.pathname !== currentValue.pathname) {
                let data = {};
                Object.assign(data,
                    currentValueFromUrl.site === previousValue.site ? {} : {site: currentValueFromUrl.site},
                    currentValueFromUrl.language === previousValue.language ? {} : {language: currentValueFromUrl.language},
                    currentValueFromUrl.path === previousValue.path ? {} : {path: currentValueFromUrl.path}
                );
                store.dispatch(dispatch => batch(() => {
                    if (data.site) {
                        dispatch(registry.get('redux-reducer', 'site').actions.setSite(data.site));
                    }

                    if (data.language) {
                        dispatch(registry.get('redux-reducer', 'language').actions.setLanguage(data.language));
                    }

                    if (data.path || data.params) {
                        dispatch(pcSetPath({path: data.path, site: currentValueFromUrl.site}));
                    }
                }));
                console.log('pathname changed', store.getState(), currentValueFromUrl, data);
            } else if ((previousValue.site !== currentValue.site && currentValueFromUrl.site !== currentValue.site) ||
                (previousValue.language !== currentValue.language && currentValueFromUrl.language !== currentValue.language)
            ) {
                console.log('state changed', store.getState(), currentValueFromUrl);
                store.dispatch(pcSetPath({path: undefined}));
            }
        }
    });
};

export const pageComposerRedux = () => {
    const jahiaCtx = window.contextJsParameters;
    const pathName = window.location.pathname.substring((jahiaCtx.contextPath + jahiaCtx.urlbase).length);
    const currentValueFromUrl = extractParamsFromUrl(pathName);
    const pathReducer = handleActions({
        [pcSetPath]: (state, action) => action.payload
    }, currentValueFromUrl.path);
    registry.add('redux-reducer', 'pagecomposer', {targets: ['root'], reducer: pathReducer});
    registry.add('redux-listener', 'pagecomposer', {targets: ['root'], createListener: getSyncListener});
};
