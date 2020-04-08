import React, {useEffect, useRef} from 'react';
import {IframeRenderer, registry} from '@jahia/ui-extender';
import {useDispatch, useSelector} from 'react-redux';
import {useHistory, useLocation} from 'react-router-dom';
import {pcSetLastVisitedSite, pcSetPath} from './PageComposer.redux';
import {batch} from 'react-redux';

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

let updateStoreAndHistory = function (pathFromChildIFrame) {
    if (pathFromChildIFrame !== '') {
        let newPath = history.location.pathname.replace(/page-composer.*/gi, 'page-composer' + pathFromChildIFrame);
        batch(() => {
            if (history.location.pathname !== newPath) {
                history.replace(newPath);
                let siteKey = pathFromChildIFrame.match(siteKeyRegexp)[1];
                let splitElement = newPath.split(siteKey)[1];
                dispatch(pcSetPath(splitElement));
                dispatch(pcSetLastVisitedSite(siteKey));
            }

            let siteKey = pathFromChildIFrame.match(siteKeyRegexp)[1];
            dispatch(registry.get('redux-action', 'setSite').action(siteKey));
            let language = pathFromChildIFrame.match(languageRegexp)[1];
            dispatch(registry.get('redux-action', 'setLanguage').action(language));
        });
    }
};

const iFrameOnHistoryMessage = event => {
    if (history) {
        if (event.origin !== window.location.origin) {
            return;
        }

        if (event.data !== null && event.data.msg !== null) {
            if (event.data.msg === 'edit frame history updated') {
                updateStoreAndHistory(getPathFromChildIFrame());
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
    const current = useSelector(state => ({
        language: state.language,
        site: state.site,
        path: state.pagecomposer.path,
        lastVisitedSite: state.pagecomposer.lastVisitedSite
    }));
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
            updateStoreAndHistory(getPathFromChildIFrame());
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
