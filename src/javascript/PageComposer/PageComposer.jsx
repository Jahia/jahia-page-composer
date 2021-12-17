import React, {useEffect, useRef, useState} from 'react';
import {IframeRenderer} from '@jahia/jahia-ui-root';
import {registry} from '@jahia/ui-extender';
import {batch, useDispatch, useSelector} from 'react-redux';
import {useHistory, useLocation} from 'react-router-dom';
import {useQuery} from '@apollo/react-hooks';
import {pcSetActive, pcSetCurrentPage, pcSetLastVisitedSite, pcSetPath} from './PageComposer.redux';
import {GetHomePage} from './PageComposer.gql';
import {ErrorPage} from './ErrorPage';
import {Loader} from '@jahia/moonstone';

let history = null;
let dispatch = null;
const placeholder = 'fake-home-placeholder';

function initialValue(location, {site, language, path, lastVisitedSite}) {
    let subPath = (path === undefined || site !== lastVisitedSite) ? placeholder : path;
    let framePathName = location?.pathname;
    let iFrameSubPath = (framePathName && !framePathName.endsWith('page-composer') && framePathName.indexOf('/sites/') !== -1) ?
        `${framePathName.substr(framePathName.lastIndexOf('/default/'))}` :
        `/default/${language}/sites/${site}${subPath}`;

    return getIFramePath(iFrameSubPath);
}

function getIFramePath(iFrameSubPath) {
    return `/cms/edit${iFrameSubPath}?redirect=false`;
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
    const [errorPage, setErrorPage] = useState(false);

    // Do not recover from lastVisitedPath in case site have been switched in an other app.
    const current = useSelector(state => ({
        language: state.language,
        site: state.site,
        path: state.pagecomposer.lastVisitedSite === state.site ? state.pagecomposer.path : undefined,
        lastVisitedSite: state.pagecomposer.lastVisitedSite
    }));
    const iFramePath = useRef(initialValue(composerLocation, current));

    /* Handle any system name changes from content-editor */
    const {oldPath, newPath} = useSelector(state => state.pagecomposer.navigateTo || {});
    useEffect(() => {
        let {pathName, queryString} = getPathFromChildIFrame();
        if (oldPath && newPath && pathName?.indexOf(oldPath) >= 0) {
            pathName = pathName.replace(oldPath, newPath);
            iFramePath.current = getIFramePath(pathName);
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
        fetchPolicy: 'network-only',
        skip: !errorPage && (current.path || current.site === current.lastVisitedSite),
        variables: {
            path: `/sites/${current.site}`
        }
    });
    if (error) {
        console.error('error while loading home page for site', current, error);
    }

    if (loading) {
        return <Loader/>;
    }

    const homePage = data?.jcr?.nodeByPath?.site?.homePage;

    if (iFramePath.current.indexOf(placeholder) !== -1 && homePage && !current.path && !error) {
        const path = iFramePath.current.replace(placeholder,
            `/${homePage.name}.html`);
        iFramePath.current = path;
        pcSetPath(path);
    }

    function checkFrameStatus(f) {
        let element = f.contentWindow.document.querySelector('head meta[name=\'description\']');
        return (element && element.attributes.content.value.startsWith('40'));
    }

    const iFrameOnLoad = e => {
        const hasError = checkFrameStatus(e.target);
        if (window.frames['page-composer-frame'] !== undefined && !hasError) {
            window.addEventListener('iframeloaded', () => {
                const f = window.frames['page-composer-frame'].contentWindow.document.querySelector('.gwt-Frame');
                if (checkFrameStatus(f)) {
                    setErrorPage(true);
                }
            });

            window.addEventListener('message', iFrameOnHistoryMessage, false);
            updateStoreAndHistory(getPathFromChildIFrame());

            setErrorPage(false);
        } else if (hasError) {
            updateStoreAndHistory(getPathFromChildIFrame());
            setErrorPage(true);
        }
    };

    if (errorPage) {
        return (
            <ErrorPage onClick={data && (() => {
                dispatch(pcSetPath(null));
                iFramePath.current = `/cms/edit/default/${current.language}${homePage.path}.html?redirect=false&force-error-page=true`;
                setErrorPage(false);
            })}
            />
        );
    }

    return (
        <IframeRenderer url={window.contextJsParameters.contextPath + iFramePath.current}
                        id="page-composer-frame"
                        onLoad={iFrameOnLoad}
        />
    );
}
