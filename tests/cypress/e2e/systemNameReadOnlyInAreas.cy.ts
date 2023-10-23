import {createSite, deleteSite} from '@jahia/cypress';
import {ContentEditor} from '@jahia/content-editor-cypress/dist/page-object/contentEditor';
import {PageComposer} from '../page-object/pageComposer';

const siteKey = 'SystemNameReadOnlySite';

describe('System name read only in areas testsuite', () => {
    before('Create site and user', () => {
        createSite(siteKey);
    });

    it('System name read only in areas', () => {
        cy.login();
        const pageComposer = PageComposer.visit(siteKey, 'en', 'home.html');
        const menu = pageComposer.openContextualMenuOnContentUntil('div[path="/sites/SystemNameReadOnlySite/home/area-main"]>div:contains("No item found")', 'Edit');
        menu.edit();
        const contentEditor = new ContentEditor();
        contentEditor.getSmallTextField('nt:base_ce:systemName', false)
            .get()
            .find('input')
            .should('have.attr', 'readonly', 'readonly');
    });

    after('Delete site and user', () => {
        deleteSite(siteKey);
    });
});
