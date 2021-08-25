import {createActions, handleActions} from 'redux-actions';
import {registry} from '@jahia/ui-extender';
import {combineReducers} from 'redux';

export const {
    pcSetCurrentPage,
    pcSetActive,
    pcSetPath,
    pcSetLastVisitedSite,
    pcSetNavigateTo
} = createActions('PC_SET_CURRENT_PAGE', 'PC_SET_ACTIVE', 'PC_SET_PATH', 'PC_SET_LAST_VISITED_SITE', 'PC_SET_NAVIGATE_TO');

const ROUTER_REDUX_ACTION = '@@router/LOCATION_CHANGE';

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
    const currentPageReducer = handleActions({
        [pcSetCurrentPage]: (state, action) => action.payload
    }, {});
    const isActiveReducer = handleActions({
        [pcSetActive]: (state, action) => action.payload
    }, false);
    let siteReducer = handleActions({
        [ROUTER_REDUX_ACTION]: (state, action) => action.payload.location.pathname.startsWith('/page-composer/') ? extractParamsFromUrl(action.payload.location.pathname).site : state
    }, '');
    let languageReducer = handleActions({
        [ROUTER_REDUX_ACTION]: (state, action) => action.payload.location.pathname.startsWith('/page-composer/') ? extractParamsFromUrl(action.payload.location.pathname).language : state
    }, '');
    const lastVisitedSiteReducer = handleActions({
        [pcSetLastVisitedSite]: (state, action) => action.payload
    }, currentValueFromUrl.site);
    const navigateToReducer = handleActions({
        [pcSetNavigateTo]: (state, action) => ({...state, ...action.payload})
    }, null);
    registry.add('redux-reducer', 'pagecomposer', {
        targets: ['root'],
        reducer: combineReducers({active: isActiveReducer, currentPage: currentPageReducer, path: pathReducer, lastVisitedSite: lastVisitedSiteReducer, navigateTo: navigateToReducer})
    });
    registry.add('redux-reducer', 'pagecomposerSite', {
        targets: ['site:2'],
        reducer: siteReducer
    });
    registry.add('redux-reducer', 'pageComposerLanguage', {
        targets: ['language:2'],
        reducer: languageReducer
    });
    registry.add('redux-action', 'pagecomposerNavigateTo', {
        action: data => dispatch => dispatch(pcSetNavigateTo(data))
    });
};
