import {addNode, createSite, createUser, deleteNode, deleteSite, deleteUser, getNodeByPath, grantRoles} from '@jahia/cypress';
import {ContentEditor} from '@jahia/content-editor-cypress/dist/page-object/contentEditor';
import {PageComposer} from '../page-object/pageComposer';

const siteKey = 'advancedPageSite';
const userName = 'advanceduser';
const adminName = 'advancedadmin';
const menuName = 'Menu title';
const subPageName = 'My sub page';
const externalLinkName = 'Jahia.com';
const internalLinkName = 'internalHome';

const pageIsLocked = (page: string, unlocked = false) => {
    cy.iframe('#page-composer-frame', {timeout: 90000}).within(() => {
        if (unlocked) {
            cy.get(`#JahiaGxtPagesTab tr:contains("${page}") div[class*="x-grid3-col-locked"] img`).should('not.exist');
        } else {
            cy.get(`#JahiaGxtPagesTab tr:contains("${page}") div[class*="x-grid3-col-locked"] img`).should('exist');
        }
    });
};

const createMenuAndSubPage = () => {
    addNode({
        parentPathOrId: `/sites/${siteKey}/home`,
        primaryNodeType: 'jnt:navMenuText',
        name: 'menu-title',
        properties: [{name: 'jcr:title', value: menuName, language: 'en'}]
    });
    cy.logout();
    cy.login(userName, 'password');
    const pc = PageComposer.visit(siteKey, 'en', 'home.html');
    pc.createPage(subPageName, {under: menuName});
    return pc;
};

const createExternalLink = () => {
    addNode({
        parentPathOrId: `/sites/${siteKey}/home`,
        primaryNodeType: 'jnt:externalLink',
        name: 'jahia-com',
        properties: [{name: 'jcr:title', value: externalLinkName, language: 'en'}, {name: 'j:url', value: 'http://www.jahia.com'}]
    });
};

describe('Advanced page testsuite', () => {
    before('Create site', () => {
        cy.login();
        createSite(siteKey);
        createUser(userName, 'password');
        createUser(adminName, 'password');
        grantRoles(`/sites/${siteKey}`, ['editor-in-chief'], userName, 'USER');
        grantRoles(`/sites/${siteKey}`, ['site-administrator'], adminName, 'USER');
        cy.logout();
    });

    beforeEach('Visit and login', () => {
        cy.visit('/');
        cy.login(userName, 'password');
    });

    // This test is skipped because it was hanging due to a OWASP warning for the external link
    // To be fixed in BACKLOG-22510
    it.skip('External link test', () => {
        PageComposer.visit(siteKey, 'en', 'home.html');
        cy.logout();
        cy.visit('/');
        cy.login(userName, 'password');
        createExternalLink();
        PageComposer.previewVisit(siteKey, 'en', 'home.html');
        cy.get('a:contains("Jahia.com")').click();
        cy.url().should('include', 'www.jahia.com');

        deleteNode(`/sites/${siteKey}/home/jahia-com`);
    });

    it('Menu title test', () => {
        createMenuAndSubPage();
        PageComposer.previewVisit(siteKey, 'en', 'home.html');
        cy.get(`li:contains("${menuName}")`).trigger('onmouseover');
        cy.get(`li:contains("${menuName}")`).trigger('mouseenter');
        cy.get(`li:contains("${menuName}") ul`).invoke('show');
        cy.get(`li:contains("${menuName}") ul li a:contains("${subPageName}")`).should('be.visible').click();
        cy.url().should('include', 'home/menu-title/my-sub-page.html');

        deleteNode(`/sites/${siteKey}/home/menu-title`);
    });

    it('Basic Lock/Unlock', () => {
        const pc = createMenuAndSubPage();
        PageComposer.visit(siteKey, 'en', 'home/menu-title/my-sub-page.html');
        let menu = pc.openContextualMenuOnLeftTreeUntil(subPageName, 'Lock');
        menu.lock();
        pc.leftTreeRefresh();
        pageIsLocked(subPageName);
        cy.logout();
        cy.visit('/');
        cy.login(adminName, 'password');
        PageComposer.visit(siteKey, 'en', 'home/menu-title/my-sub-page.html');
        pc.leftTreeRefresh();
        pageIsLocked(subPageName);
        menu = pc.openContextualMenuOnLeftTreeUntil(subPageName, 'Edit');

        const ce = new ContentEditor();
        menu.edit();
        cy.get('[data-sel-role="read-only-badge"]').should('be.visible');
        cy.get('[data-sel-role="lock-info-badge"]').contains(userName).should('be.visible');
        ce.cancel();
        cy.reload();
        menu = pc.openContextualMenuOnLeftTreeUntil(subPageName, 'Edit');
        menu.actionShouldntBeDisplayed('Unlock');
        cy.logout();
        cy.visit('/');
        cy.login(userName, 'password');
        PageComposer.visit(siteKey, 'en', 'home/menu-title/my-sub-page.html');
        menu = pc.openContextualMenuOnLeftTreeUntil(subPageName, 'Unlock');
        menu.unlock();
        pc.leftTreeRefresh();
        pageIsLocked(subPageName, true);
        deleteNode(`/sites/${siteKey}/home/menu-title`);
    });

    // To be fixed in BACKLOG-22510
    it.skip('Lock/Clear lock', () => {
        createExternalLink();
        getNodeByPath(`/sites/${siteKey}/home`).then(home => {
            addNode({
                parentPathOrId: `/sites/${siteKey}/home`,
                primaryNodeType: 'jnt:nodeLink',
                name: 'internal-home',
                properties: [{name: 'jcr:title', value: 'internalHome', language: 'en'}, {name: 'j:node', value: home.data.jcr.nodeByPath.uuid}]
            });
        });
        cy.login(userName, 'password');
        const pc = createMenuAndSubPage();
        cy.login();
        PageComposer.visit(siteKey, 'en', 'home.html');
        let menu = pc.openContextualMenuOnLeftTreeUntil('Home', 'Lock');
        menu.lock();
        pc.leftTreeRefresh();
        menu = pc.openContextualMenuOnLeftTreeUntil('Home', 'Clear lock on node and children');
        menu.clearLock(true);
        pc.leftTreeRefresh();
        pageIsLocked('Home', true);
        pageIsLocked(internalLinkName, true);
        pageIsLocked(externalLinkName, true);
        pageIsLocked(menuName, true);
        cy.logout();
        cy.visit('/');
        cy.login(adminName, 'password');
        PageComposer.visit(siteKey, 'en', 'home.html');
        pageIsLocked('Home', true);
        pageIsLocked(internalLinkName, true);
        pageIsLocked(externalLinkName, true);
        pageIsLocked(menuName, true);
        menu = pc.openContextualMenuOnLeftTreeUntil('Home', 'Edit');
        menu.edit();
        cy.get('[data-sel-role="read-only-badge"]').should('not.exist');
        cy.get('[data-sel-role="lock-info-badge"]').should('not.exist');
        const ce = new ContentEditor();
        cy.get('[id="jnt:page_jcr:title"]').clear({force: true});
        cy.get('[id="jnt:page_jcr:title"]').type('test', {force: true});
        ce.cancel();

        PageComposer.visit(siteKey, 'en', 'home.html');
        menu = pc.openContextualMenuOnLeftTreeUntil(internalLinkName, 'Edit');
        menu.edit();
        cy.get('[data-sel-role="read-only-badge"]').should('not.exist');
        cy.get('[data-sel-role="lock-info-badge"]').should('not.exist');
        cy.get('[id="jnt:nodeLink_jcr:title"]').clear({force: true});
        cy.get('[id="jnt:nodeLink_jcr:title"]').type('test', {force: true});
        ce.cancel();
    });

    afterEach('logout', () => {
        cy.logout();
    });

    after('Delete site and users', () => {
        cy.login();
        deleteSite(siteKey);
        deleteUser(userName);
        deleteUser(adminName);
        cy.logout();
    });
});
