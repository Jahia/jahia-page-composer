import {PageComposer} from '../page-object/pageComposer';
import {ContentEditor} from '../page-object/contentEditor';

describe('Page creation tests', () => {
    const site = 'pageComposerSite';
    const nameWithSpecialChars = 'list\'asasa\'an@##$%#$%@#%';
    let pageComposer: PageComposer;
    let contentEditor: ContentEditor;

    before(function () {
        cy.executeGroovy('createSite.groovy', { SITEKEY: site })
        cy.login()
    })

    after(function () {
        cy.logout()
        cy.executeGroovy('deleteSite.groovy', { SITEKEY: site })
    })

    beforeEach(function () {
        pageComposer = PageComposer.visit(site, 'en', 'home.html');
    })

    it('Special characters are handled correctly in page name', function () {
        cy.wait(1000)
        pageComposer.createPage(nameWithSpecialChars);
        // Wait for frame to load created page fully
        PageComposer.visit(site, 'en', 'home.html');
        cy.wait(5000);
        pageComposer.navigateToPage(nameWithSpecialChars);
        cy.wait(500);
        // TODO this will need to be changed to accommodate updated functionality
        cy.get('h1').contains('Page not found');
    })
})
