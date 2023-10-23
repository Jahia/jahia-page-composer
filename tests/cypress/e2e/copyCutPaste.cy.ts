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
        setNodeProperty('/sites/digitall/home/about', 'jcr:description', 'That\'s the description', 'en');
        setNodeProperty('/sites/digitall/home/about', 'jcr:description', 'C\'est la description', 'fr');
        addVanityUrl('/sites/digitall/home/about', 'en', '/about');
        cy.logout();
    });

    it('Copy and paste in another site', () => {
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

    it('Copy and paste under the same site, same parent', () => {
        const composer = new PageComposer();
        cy.login();
        PageComposer.visit('digitall', 'en', 'home.html');
        let contextMenu = composer.openContextualMenuOnLeftTree('About');
        contextMenu.copy();
        contextMenu = composer.openContextualMenuOnLeftTreeUntil('Home', 'Paste');
        contextMenu.paste().then(() => {
            checkDescriptions('/sites/digitall/home/about-1');
            cy.reload();
            cy.iframe('#page-composer-frame').within(() => {
                cy.get('div[class *= "x-grid3-row"]:contains("About")').should('have.length', 2);
            });
            getNodeByPath('/sites/digitall/home/about-1', ['jcr:title'], 'en').then(result => {
                expect(result?.data?.jcr?.nodeByPath?.name).to.eq('about-1');
                expect(result?.data?.jcr?.nodeByPath?.properties[0].value).to.eq('About');
            });
            deleteNode('/sites/digitall/home/about-1');
        });
        cy.logout();
    });

    it('Copy and paste under the same site, other parent', () => {
        const composer = new PageComposer();
        cy.login();
        PageComposer.visit('digitall', 'en', 'home.html');
        let contextMenu = composer.openContextualMenuOnLeftTree('About');
        contextMenu.copy();
        contextMenu = composer.openContextualMenuOnLeftTreeUntil('Newsroom', 'Paste');
        contextMenu.paste().then(() => {
            checkDescriptions('/sites/digitall/home/newsroom/about');
            getNodeByPath('/sites/digitall/home/newsroom/about', ['jcr:title'], 'en').then(result => {
                expect(result?.data?.jcr?.nodeByPath?.name).to.eq('about');
                expect(result?.data?.jcr?.nodeByPath?.properties[0].value).to.eq('About');
            });
            deleteNode('/sites/digitall/home/newsroom/about');
        });
        cy.logout();
    });

    it('Cut and paste under another site / check vanity url isn\'t the same', () => {
        const composer = new PageComposer();
        cy.login();
        PageComposer.visit('digitall', 'en', 'home.html');
        let contextMenu = composer.openContextualMenuOnLeftTree('About');
        contextMenu.cut();
        composer.openContextualMenuOnLeftTreeUntil('Newsroom', 'Paste');
        PageComposer.visit('testsite', 'en', 'home.html');
        contextMenu = composer.openContextualMenuOnLeftTreeUntil('Home', 'Paste');
        contextMenu.paste().then(() => {
            cy.waitUntil(
                () =>
                    getVanityUrl('/sites/testsite/home/about', ['en']).then(
                        result => result?.data?.jcr?.nodeByPath?.vanityUrls[0]?.url === '/about'
                    ),
                {
                    timeout: 30000,
                    interval: 1000,
                    verbose: true
                }
            );
            moveNode('/sites/testsite/home/about', '/sites/digitall/home', 'about');
        });
        cy.logout();
    });

    after('Clean content', () => {
        cy.login();
        deleteSite('testsite');
        deleteNodeProperty('/sites/digitall/home/about', 'jcr:description', 'en');
        deleteNodeProperty('/sites/digitall/home/about', 'jcr:description', 'fr');
        removeVanityUrl('/sites/digitall/home/about', '/about');
        cy.logout();
    });
});
