import {createActions, handleActions} from 'redux-actions';
import {registry} from '@jahia/ui-extender';
import {combineReducers} from 'redux';

export const {pcSetPath, pcSetLastVisitedSite} = createActions('PC_SET_PATH', 'PC_SET_LAST_VISITED_SITE');

const extractParamsFromUrl = pathname => {
    if (pathname.startsWith('/page-composer/')) {
        let [, , , language, , site, ...pathElements] = pathname.split('/');

        let path = ('/' + pathElements.join('/'));

        path = decodeURIComponent(path);
        return {site, language, path};
    }

    return {site: '', language: '', path: ''};
};

export const pageComposerRedux = () => {
    const jahiaCtx = window.contextJsParameters;
    const pathName = window.location.pathname.substring((jahiaCtx.contextPath + jahiaCtx.urlbase).length);
    const currentValueFromUrl = extractParamsFromUrl(pathName);
    const pathReducer = handleActions({
        [pcSetPath]: (state, action) => action.payload
    }, currentValueFromUrl.path);
    const lastVisitedSiteReducer = handleActions({
        [pcSetLastVisitedSite]: (state, action) => action.payload
    }, currentValueFromUrl.site);
    registry.add('redux-reducer', 'pagecomposer', {
        targets: ['root'],
        reducer: combineReducers({path: pathReducer, lastVisitedSite: lastVisitedSiteReducer}),
        actions: {pcSetPath, pcSetLastVisitedSite}
    });
};
