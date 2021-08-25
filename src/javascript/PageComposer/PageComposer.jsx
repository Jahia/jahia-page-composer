import React, {useEffect, useRef} from 'react';
import {IframeRenderer} from '@jahia/jahia-ui-root';
import {registry} from '@jahia/ui-extender';
import {batch, useDispatch, useSelector} from 'react-redux';
import {useHistory, useLocation} from 'react-router-dom';
import {useQuery} from '@apollo/react-hooks';
import {pcSetActive, pcSetCurrentPage, pcSetLastVisitedSite, pcSetPath} from './PageComposer.redux';
import {GetHomePage} from './PageComposer.gql';

let history = null;
let dispatch = null;
const placeholder = 'fake-home-placeholder';

function initialValue(location, {site, language, path, lastVisitedSite}) {
    let subPath = (path === undefined || site !== lastVisitedSite) ? placeholder : path;
    let mainResourcePath = `/cms/edit/default/${language}/sites/${site}${subPath}`;
    if (location && !location.pathname.endsWith('page-composer') && location.pathname.indexOf('/sites/') !== -1) {
        mainResourcePath = `/cms/edit${location.pathname.substr(location.pathname.lastIndexOf('/default/'))}`;
    }

    return mainResourcePath + '?redirect=false';
}

function getPathFromChildIFrame() {
    if (window.frames['page-composer-frame'] !== undefined) {
        const location = window.frames['page-composer-frame'].contentWindow.location;
        let framepathname = location.pathname;

        if (framepathname.indexOf('/default/') !== -1) {
            return {
                pathName: framepathname.substr(framepathname.lastIndexOf('/default/')),
                queryString: location.search
            };
        }

        return {pathName: framepathname, queryString: location.search};
    }

    return {};
}

function updateStoreAndHistory(pathFromChildIFrame) {
    const languageRegexp = /\/default\/(.[^/]*)\/sites\//;
    const siteKeyRegexp = /\/sites\/(.[^/]*)\//;

    if (pathFromChildIFrame) {
        const {pathName, queryString} = pathFromChildIFrame;
        let newPath = history.location.pathname.replace(/page-composer.*/gi, 'page-composer' + pathName);
        batch(() => {
            if (!pathName.match(siteKeyRegexp)) {
                // Site cannot be resolved, do nothing
                return;
            }

            let siteKey = pathName.match(siteKeyRegexp)[1];
            let [, ...rest] = newPath.split(siteKey);
            const relSitePath = rest.join(siteKey); // Path relative to site URL
            const parentPath = relSitePath.substring(0, relSitePath.lastIndexOf('/'));
            const pageName = relSitePath.substring(relSitePath.lastIndexOf('/') + 1);

            /* Parse pageName */
            const pageNameArray = pageName.split('.');
            const templateType = pageNameArray.pop(); // Assumption: template type exists at the end
            const templateName = (pageNameArray.length > 1) ? pageNameArray.pop() : 'default';
            const nodeName = pageNameArray.join('.');
            const nodePath = `/sites/${siteKey}${parentPath}/${nodeName}`;

            if (history.location.pathname !== newPath) {
                history.replace(newPath);
                dispatch(pcSetPath(relSitePath));
                dispatch(pcSetLastVisitedSite(siteKey));
            }

            dispatch(registry.get('redux-action', 'setSite').action(siteKey));
            let language = pathName.match(languageRegexp)[1];
            dispatch(registry.get('redux-action', 'setLanguage').action(language));
            dispatch(pcSetCurrentPage({
                path: nodePath,
                templateType,
                template: templateName,
                queryString
            }));
        });
    }
}

function iFrameOnHistoryMessage(event) {
    if (!history || event.origin !== window.location.origin) {
        return;
    }

    let eventMsg = event?.data?.msg;
    if (eventMsg === 'edit frame history updated') {
        updateStoreAndHistory(getPathFromChildIFrame());
    } else if (eventMsg === 'setTitle') {
        document.title = event.data.title;
    }
}

export default function () {
    const composerLocation = useLocation();
    history = useHistory();
    dispatch = useDispatch();

    // Do not recover from lastVisitedPath in case site have been switched in an other app.
    const current = useSelector(state => ({
        language: state.language,
        site: state.site,
        path: state.pagecomposer.lastVisitedSite === state.site ? state.pagecomposer.path : undefined,
        lastVisitedSite: state.pagecomposer.lastVisitedSite
    }));

    /* Handle any system name changes from content-editor */
    const {oldPath, newPath} = useSelector(state => state.pagecomposer.navigateTo || {});
    useEffect(() => {
        let {pathName, queryString} = getPathFromChildIFrame();
        if (oldPath && newPath && pathName?.indexOf(oldPath) >= 0) {
            pathName = pathName.replace(oldPath, newPath);
            mainResourcePath.current = `/cms/edit${pathName}?redirect=false`;
            updateStoreAndHistory({pathName, queryString});
        }
    }, [oldPath, newPath]);

    useEffect(() => {
        if (window.frames['page-composer-frame'] !== undefined) {
            window.addEventListener('message', iFrameOnHistoryMessage, false);
        }

        // Store initial location on mount
        updateStoreAndHistory({pathName: window.location.pathname, queryString: window.location.search});
        dispatch(pcSetActive(true));

        return () => {
            dispatch(pcSetActive(false));
            window.removeEventListener('message', iFrameOnHistoryMessage, false);
        };
    }, []);

    if (current.site === 'systemsite') {
        return <h2 style={{color: 'grey'}}>You need to create a site to see this page</h2>;
    }

    const {error, data, loading} = useQuery(GetHomePage, {
        skip: current.path || current.site === current.lastVisitedSite,
        variables: {
            query: `SELECT * FROM [jnt:page] where ischildnode('/sites/${current.site}') and [j:isHomePage]=true`
        }
    });

    if (loading) {
        return <></>;
    }

    const mainResourcePath = useRef(initialValue(composerLocation, current));
    if (mainResourcePath.current.indexOf(placeholder) !== -1 && data && !current.path && !error) {
        const path = mainResourcePath.current.replace(placeholder,
            `/${data.jcr.nodesByQuery.nodes[0].name}.html`);
        mainResourcePath.current = path;
        pcSetPath(path);
    }

    const iFrameOnLoad = () => {
        if (window.frames['page-composer-frame'] !== undefined) {
            window.addEventListener('message', iFrameOnHistoryMessage, false);
            updateStoreAndHistory(getPathFromChildIFrame());
        }
    };

    return (
        <IframeRenderer url={window.contextJsParameters.contextPath + mainResourcePath.current}
                        id="page-composer-frame"
                        onLoad={iFrameOnLoad}
        />
    );
}
