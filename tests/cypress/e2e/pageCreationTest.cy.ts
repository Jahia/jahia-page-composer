import {PageComposer} from '../page-object/pageComposer';
import {getComponentByRole, Button, deleteNode, publishAndWaitJobEnding, createSite, deleteSite} from '@jahia/cypress';

const undelete = (pageTitle: string) => {
    const pageComposer = new PageComposer();
    const contextualMenu = pageComposer.openContextualMenuOnLeftTree(pageTitle);
    contextualMenu.undelete();
    cy.get('button[data-sel-role="delete-undelete-button"]').click();
};

const markForDeletion = (pageTitle: string) => {
    const pageComposer = new PageComposer();
    const contextualMenu = pageComposer.openContextualMenuOnLeftTree(pageTitle);
    contextualMenu.delete();
    return cy.get('button[data-sel-role="delete-mark-button"]').click();
};

describe('Page creation tests', () => {
    const site = 'pageComposerSite';
    const basicName = 'New page 1';
    const basicSystemName = 'new-page-1';
    const nameWithSpecialChars = 'list\'asasa\'an@##$%#$%@#%';
    const systemName = 'listSysName';
    let pageComposer: PageComposer;

    before(() => {
        createSite(site);
    });

    after(() => {
        cy.logout();
        deleteSite(site);
    });

    beforeEach(() => {
        cy.login();
        pageComposer = PageComposer.visit(site, 'en', 'home.html');
    });

    it('Base test', () => {
        pageComposer.createPage(basicName, {systemName: basicSystemName});
        markForDeletion(basicName);
        cy.reload();
        undelete(basicName);
        cy.reload();
        markForDeletion(basicName);
        publishAndWaitJobEnding('/sites/' + site);
        cy.apollo({
            errorPolicy: 'all',
            variables: {
                path: `/sites/${site}/home/${basicSystemName}`
            },
            queryFile: 'graphql/jcr/query/getNodeByPath.graphql'
        }).then(result => {
            expect(result.errors[0].message).to.contain('javax.jcr.PathNotFoundException');
        });
        pageComposer.createPage(basicName, {systemName: basicSystemName});
        cy.reload();
        cy.apollo({
            errorPolicy: 'all',
            variables: {
                path: `/sites/${site}/home/${basicSystemName}`
            },
            queryFile: 'graphql/jcr/query/getNodeByPath.graphql'
        }).then(result => {
            expect(result.errors).to.not.exist;
        });
        deleteNode(`/sites/${site}/home/${basicSystemName}`);
    });

    it('Special characters are handled correctly in page name', () => {
        pageComposer.createPage(nameWithSpecialChars, {systemName: systemName});
        PageComposer.visit(site, 'en', 'home.html');
        pageComposer.navigateToPage(nameWithSpecialChars);
        pageComposer.shouldContain(nameWithSpecialChars);
        deleteNode(`/sites/${site}/home/${systemName}`);
    });

    it('Special characters are not allowed in system name', () => {
        pageComposer.createPage(nameWithSpecialChars, {systemName: nameWithSpecialChars, save: false});
        getComponentByRole(Button, 'createButton').click();
        cy.get('div[data-sel-role="dialog-errorBeforeSave"]').contains('System name').should('be.visible');
    });
});
