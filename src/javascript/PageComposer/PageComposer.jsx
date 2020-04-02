import React, {useEffect, useRef} from 'react';
import {registry} from '@jahia/ui-extender';
import {useDispatch, useSelector} from 'react-redux';
import {useHistory, useLocation} from 'react-router-dom';
import {IframeRenderer} from '@jahia/ui-extender';

let initialValue = function (location, siteKey, language, path, lastVisitedSite) {
    let subPath = (path === undefined || siteKey !== lastVisitedSite) ? '/home.html' : path;
    let mainResourcePath = `/cms/edit/default/${language}/sites/${siteKey}${subPath}`;
    if (!location.pathname.endsWith('page-composer') && location.pathname.indexOf('/sites/') >= 0) {
        mainResourcePath = `/cms/edit/${location.pathname.substr(location.pathname.lastIndexOf('/default/'))}`;
    }

    return mainResourcePath + '?redirect=false';
};

let history = null;
let dispatch = null;
const languageRegexp = /\/default\/(.[^/]*)\/sites\//;
const siteKeyRegexp = /\/sites\/(.[^/]*)\//;

let getPathFromChildIFrame = function () {
    if (window.frames['page-composer-frame'] !== undefined) {
        let framepathname = window.frames['page-composer-frame'].contentWindow.location.pathname;

        return framepathname.substr(framepathname.lastIndexOf('/default/'));
    }

    return '';
};

let updateStoreAndHistory = function (pathFromChildIFrame, currentSiteKey, currentLanguage) {
    if (pathFromChildIFrame !== '') {
        let newPath = history.location.pathname.replace(/page-composer.*/gi, 'page-composer' + pathFromChildIFrame);
        history.replace(newPath);
        let siteKey = pathFromChildIFrame.match(siteKeyRegexp)[1];
        let language = pathFromChildIFrame.match(languageRegexp)[1];
        if (currentSiteKey !== siteKey) {
            dispatch(registry.get('redux-reducer', 'site').actions.setSite(siteKey));
        }

        if (currentLanguage !== language) {
            dispatch(registry.get('redux-reducer', 'language').actions.setLanguage(language));
        }
    }
};

const iFrameOnHistoryMessage = event => {
    if (history) {
        if (event.origin !== window.location.origin) {
            return;
        }

        if (event.data !== null && event.data.msg !== null) {
            if (event.data.msg === 'edit frame history updated') {
                let currentSiteKey = history.location.pathname.match(siteKeyRegexp)[1];
                let currentLanguage = history.location.pathname.match(languageRegexp)[1];
                let pathFromChildIFrame = getPathFromChildIFrame();

                updateStoreAndHistory(pathFromChildIFrame, currentSiteKey, currentLanguage);
            } else if (event.data.msg === 'setTitle') {
                document.title = event.data.title;
            }
        }
    }
};

export default function () {
    const composerLocation = useLocation();
    history = useHistory();
    dispatch = useDispatch();
    const current = useSelector(state => ({language: state.language, site: state.site, path: state.pagecomposer.path, lastVisitedSite: state.pagecomposer.lastVisitedSite}));
    const mainResourcePath = useRef(initialValue(composerLocation, current.site, current.language, current.path, current.lastVisitedSite));
    useEffect(() => {
        if (window.frames['page-composer-frame'] !== undefined) {
            window.addEventListener('message', iFrameOnHistoryMessage, false);
        }

        return () => {
            window.removeEventListener('message', iFrameOnHistoryMessage, false);
        };
    }, []);

    const iFrameOnLoad = () => {
        if (window.frames['page-composer-frame'] !== undefined) {
            window.addEventListener('message', iFrameOnHistoryMessage, false);
            let currentSiteKey = location.pathname.endsWith('page-composer') ? '' : history.location.pathname.match(siteKeyRegexp)[1];
            let currentLanguage = location.pathname.endsWith('page-composer') ? '' : history.location.pathname.match(languageRegexp)[1];
            let pathFromChildIFrame = getPathFromChildIFrame();
            updateStoreAndHistory(pathFromChildIFrame, currentSiteKey, currentLanguage);
        }
    };

    if (current.site === 'systemsite') {
        return <h2 style={{color: 'grey'}}>You need to create a site to see this page</h2>;
    }

    return (
        <IframeRenderer url={window.contextJsParameters.contextPath + mainResourcePath.current}
                        id="page-composer-frame"
                        onLoad={iFrameOnLoad}
        />
    );
}
