import React, {useEffect, useState} from 'react';
import Iframe from 'react-iframe';
import {useSelector} from 'react-redux';
import {useHistory, useLocation} from 'react-router-dom';

let path = (locale, siteKey, mainResourcePath) => {
    return `/cms/edit/default/${locale}/sites/${siteKey}${mainResourcePath}?redirect=false`;
};

let initialValue = function (location, siteKey) {
    let mainResourcePath = '/home.html';
    if (!location.pathname.endsWith('page-composer') && location.pathname.indexOf(siteKey) >= 0) {
        if (window.frames['page-composer-frame'] === undefined) {
            mainResourcePath = location.pathname.split(siteKey)[1];
        }
    }

    return mainResourcePath;
};

let history = null;

let getPathFromChildIFrame = function () {
    let framepathname = window.frames[1].location.pathname;

    return framepathname.substr(framepathname.lastIndexOf('/sites/'));
};

const iFrameOnHistoryMessage = event => {
    if (history !== null) {
        if (event.origin !== window.location.origin) {
            return;
        }

        if (event.data !== null && event.data.msg !== null) {
            console.log('iFrameOnHistoryMessage', event.data);
            if (event.data.msg === 'edit frame history updated') {
                let pathFromChildIFrame = getPathFromChildIFrame();
                let newPath = history.location.pathname.replace(/page-composer.*/gi, 'page-composer' + pathFromChildIFrame);
                history.replace(newPath);
            } else if (event.data.msg === 'setTitle') {
                document.title = event.data.title;
            }
        }
    }
};

export default function () {
    const composerLocation = useLocation();
    history = useHistory();
    const current = useSelector(state => ({language: state.language, site: state.site}));
    const [mainResourcePath] = useState(initialValue(composerLocation, current.site));
    useEffect(() => {
        if (window.frames['page-composer-frame'] !== undefined) {
            window.addEventListener('message', iFrameOnHistoryMessage, false);
        }

        return () => {
            window.removeEventListener('message', iFrameOnHistoryMessage, false);
        };
    });

    const iFrameOnLoad = () => {
        if (window.frames['page-composer-frame'] !== undefined) {
            window.addEventListener('message', iFrameOnHistoryMessage, false);
        }
    };

    // Temporary solution
    if (current.site === 'systemsite') {
        return <h2 style={{color: 'grey'}}>You need to create a site to see this page</h2>;
    }

    return (
        <Iframe url={window.contextJsParameters.contextPath + path(current.language, current.site, mainResourcePath)}
                width="100%"
                height="100%"
                id="page-composer-frame"
                onLoad={iFrameOnLoad}
        />
    );
}
