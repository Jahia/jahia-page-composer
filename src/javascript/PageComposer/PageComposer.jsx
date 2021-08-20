import React, {useEffect, useRef, useState} from 'react';
import {IframeRenderer} from '@jahia/jahia-ui-root';
import {registry} from '@jahia/ui-extender';
import {batch, useDispatch, useSelector} from 'react-redux';
import {useHistory, useLocation} from 'react-router-dom';
import {useQuery} from '@apollo/react-hooks';
import {pcSetActive, pcSetCurrentPage, pcSetLastVisitedSite, pcSetPath, pcSetNavigateTo} from './PageComposer.redux';
import {GetHomePage} from './PageComposer.gql';
import styles from './PageComposer.scss';
import {Loader} from '@jahia/moonstone';

const placeholder = 'fake-home-placeholder';

function initialValue(location, {site, language, path, lastVisitedSite}) {
    let subPath = (path === undefined || site !== lastVisitedSite) ? placeholder : path;
    let mainResourcePath = `/cms/edit/default/${language}/sites/${site}${subPath}`;
    if (location && !location.pathname.endsWith('page-composer') && location.pathname.indexOf('/sites/') !== -1) {
        mainResourcePath = `/cms/edit${location.pathname.substr(location.pathname.lastIndexOf('/default/'))}`;
    }

    return mainResourcePath + '?redirect=false';
}

let history = null;
let dispatch = null;
const languageRegexp = /\/default\/(.[^/]*)\/sites\//;
const siteKeyRegexp = /\/sites\/(.[^/]*)\//;

let getPathFromChildIFrame = function () {
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
};

let updateStoreAndHistory = function (pathFromChildIFrame) {
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
            dispatch(pcSetNavigateTo(null));
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

const loadingStatuses = {
    LOADING: 0,
    LOADED: 1,
    ERROR: 2
};

export default function () {
    const composerLocation = useLocation();
    history = useHistory();
    dispatch = useDispatch();
    const [status, setStatus] = useState(loadingStatuses.LOADING);

    // Do not recover from lastVisitedPath in case site have been switched in an other app.
    const current = useSelector(state => ({
        language: state.language,
        site: state.site,
        path: state.pagecomposer.lastVisitedSite === state.site ? state.pagecomposer.path : undefined,
        lastVisitedSite: state.pagecomposer.lastVisitedSite,
        navigateTo: state.pagecomposer.navigateTo
    }));

    useEffect(() => {
        // Path changes via redux action, construct new path
        if (current.navigateTo) {
            const p = initialValue(composerLocation, current).replace(current.path, current.navigateTo);
            mainResourcePath.current = p;
            updateStoreAndHistory({pathName: p.replace('/cms/edit', '').replace('?redirect=false', ''), queryString: window.location.search});
        }
    }, [current.navigateTo]);

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

    const iFrameOnLoad = e => {
        // This captures 404 if incorrect URL is submitted
        const hasError = e.target.contentDocument.title.toLowerCase() === '404 error';
        if (window.frames['page-composer-frame'] !== undefined && !hasError) {
            window.addEventListener('message', iFrameOnHistoryMessage, false);
            // This captures 404 generated by the inner inner frame
            window.addEventListener('pagecomposer404event', () => {
                setStatus(loadingStatuses.ERROR);
            });
            updateStoreAndHistory(getPathFromChildIFrame());
            setStatus(loadingStatuses.LOADED);
        } else if (hasError) {
            setStatus(loadingStatuses.ERROR);
        }
    };

    if (current.site === 'systemsite') {
        return <h2 style={{color: 'grey'}}>You need to create a site to see this page</h2>;
    }

    const mainResourcePath = useRef(initialValue(composerLocation, current));

    const {error, data, loading} = useQuery(GetHomePage, {
        skip: current.path || current.site === current.lastVisitedSite,
        variables: {
            query: `SELECT * FROM [jnt:page] where ischildnode('/sites/${current.site}') and [j:isHomePage]=true`
        }
    });

    if (loading) {
        return <></>;
    }

    if (mainResourcePath.current.indexOf(placeholder) !== -1 && data && !current.path && !error) {
        const path = mainResourcePath.current.replace(placeholder,
            `/${data.jcr.nodesByQuery.nodes[0].name}.html`);
        mainResourcePath.current = path;
        pcSetPath(path);
    }

    // TODO replace with whatever gets designed for this
    // There is an issue with going back home when deleted page is publish which most likely has to do with
    // The fact that PC's js is broken and it cannot reload inner frame. Can be addressed with location.reload but maybe there is something better?
    const ErrorComponent = (
        <div>
            <h1>My Fancy Error Page (currently being designed)</h1>
            <button type="button"
                    onClick={() => {
                dispatch(pcSetNavigateTo('/home.html'));
                // SetTimeout(() => window.location.reload(),  500);
            }}
            >Back to home
            </button>
        </div>
    );

    return (
        <>
            {status === loadingStatuses.LOADING && <Loader/>}
            {status === loadingStatuses.ERROR && ErrorComponent}
            <IframeRenderer className={status === loadingStatuses.LOADED ? styles.PageComposerIframeShown : styles.PageComposerIframeHidden}
                            url={window.contextJsParameters.contextPath + mainResourcePath.current}
                            id="page-composer-frame"
                            onLoad={iFrameOnLoad}
            />
        </>
    );
}
