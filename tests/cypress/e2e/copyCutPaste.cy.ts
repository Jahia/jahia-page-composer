/* eslint cypress/no-unnecessary-waiting: "off" */

import {
    createSite,
    deleteSite,
    getNodeByPath,
    deleteNode,
    setNodeProperty,
    deleteNodeProperty,
    addVanityUrl,
    getVanityUrl,
    removeVanityUrl,
    moveNode
} from '@jahia/cypress';
import {PageComposer} from '../page-object/pageComposer';

const checkDescriptions = (path: string) => {
    cy.waitUntil(
        () =>
            getNodeByPath(path, ['jcr:description'], 'en').then(
                result =>
                    result?.data?.jcr?.nodeByPath?.name === path.split('/').pop() &&
                    result?.data?.jcr?.nodeByPath?.properties[0].value === 'That\'s the description'
            ),
        {
            timeout: 30000,
            interval: 1000,
            verbose: true
        }
    );
    getNodeByPath(path, ['jcr:description'], 'fr').then(result => {
        expect(result?.data?.jcr?.nodeByPath?.name).to.eq(path.split('/').pop());
        expect(result?.data?.jcr?.nodeByPath?.properties[0].value).to.eq('C\'est la description');
    });
};

describe('Copy Cut and Paste tests with page composer', () => {
    before('Create required content', () => {
        cy.login();
        createSite('testsite');
        // About
        setNodeProperty('/sites/digitall/home/about', 'jcr:description', 'That\'s the description', 'en');
        setNodeProperty('/sites/digitall/home/about', 'jcr:description', 'C\'est la description', 'fr');
        addVanityUrl('/sites/digitall/home/about', 'en', '/about');

        // Newsroom
        setNodeProperty('/sites/digitall/home/newsroom', 'jcr:description', 'That\'s the description', 'en');
        setNodeProperty('/sites/digitall/home/newsroom', 'jcr:description', 'C\'est la description', 'fr');
        addVanityUrl('/sites/digitall/home/newsroom', 'en', '/newsroom');

        // Investors
        setNodeProperty('/sites/digitall/home/investors', 'jcr:description', 'That\'s the description', 'en');
        setNodeProperty('/sites/digitall/home/investors', 'jcr:description', 'C\'est la description', 'fr');
        addVanityUrl('/sites/digitall/home/investors', 'en', '/investors');

        // Our companies
        setNodeProperty('/sites/digitall/home/our-companies', 'jcr:description', 'That\'s the description', 'en');
        setNodeProperty('/sites/digitall/home/our-companies', 'jcr:description', 'C\'est la description', 'fr');
        addVanityUrl('/sites/digitall/home/our-companies', 'en', '/our-companies');
        cy.logout();
    });

    it('Copy and paste in another site (about page)', () => {
        const composer = new PageComposer();
        cy.login();
        PageComposer.visit('digitall', 'en', 'home.html');
        let contextMenu = composer.openContextualMenuOnLeftTree('About');
        contextMenu.copy();
        composer.openContextualMenuOnLeftTreeUntil('Newsroom', 'Paste');
        PageComposer.visit('testsite', 'en', 'home.html');
        contextMenu = composer.openContextualMenuOnLeftTreeUntil('Home', 'Paste');
        contextMenu.paste().then(() => {
            checkDescriptions('/sites/testsite/home/about');
            deleteNode('/sites/testsite/home/about');
        });
        cy.logout();
    });

    it('Copy and paste under the same site, same parent (newsroom page)', () => {
        const composer = new PageComposer();
        cy.login();
        PageComposer.visit('digitall', 'en', 'home.html');
        let contextMenu = composer.openContextualMenuOnLeftTree('Newsroom');
        contextMenu.copy();
        contextMenu = composer.openContextualMenuOnLeftTreeUntil('Home', 'Paste');
        contextMenu.paste().then(() => {
            checkDescriptions('/sites/digitall/home/newsroom-1');
            cy.reload();
            cy.iframe('#page-composer-frame').within(() => {
                cy.get('div[class *= "x-grid3-row"]:contains("Newsroom")').should('have.length', 2);
            });
            getNodeByPath('/sites/digitall/home/newsroom-1', ['jcr:title'], 'en').then(result => {
                expect(result?.data?.jcr?.nodeByPath?.name).to.eq('newsroom-1');
                expect(result?.data?.jcr?.nodeByPath?.properties[0].value).to.eq('Newsroom');
            });
            deleteNode('/sites/digitall/home/newsroom-1');
        });
        cy.logout();
    });

    it('Copy and paste under the same site, other parent (investors page)', () => {
        const composer = new PageComposer();
        cy.login();
        PageComposer.visit('digitall', 'en', 'home.html');
        let contextMenu = composer.openContextualMenuOnLeftTree('Investors');
        contextMenu.copy();
        contextMenu = composer.openContextualMenuOnLeftTreeUntil('Newsroom', 'Paste');
        contextMenu.paste().then(() => {
            checkDescriptions('/sites/digitall/home/newsroom/investors');
            getNodeByPath('/sites/digitall/home/newsroom/investors', ['jcr:title'], 'en').then(result => {
                expect(result?.data?.jcr?.nodeByPath?.name).to.eq('investors');
                expect(result?.data?.jcr?.nodeByPath?.properties[0].value).to.eq('Investors');
            });
            deleteNode('/sites/digitall/home/newsroom/investors');
        });
        cy.logout();
    });

    it('Cut and paste under another site / check vanity url isn\'t the same (our companies page)', () => {
        const composer = new PageComposer();
        cy.login();
        PageComposer.visit('digitall', 'en', 'home.html');
        let contextMenu = composer.openContextualMenuOnLeftTree('Our Companies');
        contextMenu.cut();
        cy.wait(5000);
        PageComposer.visit('testsite', 'en', 'home.html');
        contextMenu = composer.openContextualMenuOnLeftTreeUntil('Home', 'Paste');
        contextMenu.paste().then(() => {
            cy.waitUntil(
                () =>
                    getVanityUrl('/sites/testsite/home/our-companies', ['en']).then(
                        result => result?.data?.jcr?.nodeByPath?.vanityUrls[0]?.url === '/our-companies'
                    ),
                {
                    timeout: 60000,
                    interval: 2000,
                    verbose: true
                }
            );
            moveNode('/sites/testsite/home/our-companies', '/sites/digitall/home', 'our-companies');
        });
        cy.logout();
    });

    after('Clean content', () => {
        cy.login();
        deleteSite('testsite');
        deleteNodeProperty('/sites/digitall/home/about', 'jcr:description', 'en');
        deleteNodeProperty('/sites/digitall/home/about', 'jcr:description', 'fr');
        removeVanityUrl('/sites/digitall/home/about', '/about');

        deleteNodeProperty('/sites/digitall/home/newsroom', 'jcr:description', 'en');
        deleteNodeProperty('/sites/digitall/home/newsroom', 'jcr:description', 'fr');
        removeVanityUrl('/sites/digitall/home/newsroom', '/newsroom');

        deleteNodeProperty('/sites/digitall/home/investors', 'jcr:description', 'en');
        deleteNodeProperty('/sites/digitall/home/investors', 'jcr:description', 'fr');
        removeVanityUrl('/sites/digitall/home/investors', '/investors');

        deleteNodeProperty('/sites/digitall/home/our-companies', 'jcr:description', 'en');
        deleteNodeProperty('/sites/digitall/home/our-companies', 'jcr:description', 'fr');
        removeVanityUrl('/sites/digitall/home/our-companies', '/our-companies');
        cy.logout();
    });
});
