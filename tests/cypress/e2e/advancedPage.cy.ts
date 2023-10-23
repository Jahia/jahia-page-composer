import { addNode, createSite, createUser, deleteNode, deleteSite, deleteUser, getNodeByPath, grantRoles, Menu } from "@jahia/cypress"
import {ContentEditor} from '@jahia/content-editor-cypress/dist/page-object/contentEditor';
import { PageComposer } from "../page-object/pageComposer"

const siteKey = 'advancedPageSite'
const userName = 'advanceduser'
const adminName = 'advancedadmin'
const page1Name = 'New page 1';
const page2Name = 'New page 2';
const menuName = 'Menu title';
const subPageName = 'My sub page';
const externalLinkName = 'Jahia.com';
const internalLinkName = 'internalHome';

const pageIsLocked = (page: string, unlocked = false) => {
    cy.iframe("#page-composer-frame", {timeout: 90000}).within(() => {
        if(!unlocked) {
            cy.get(`#JahiaGxtPagesTab tr:contains("${page}") div[class*="x-grid3-col-locked"] img`).should('exist');
        } else {
            cy.get(`#JahiaGxtPagesTab tr:contains("${page}") div[class*="x-grid3-col-locked"] img`).should('not.exist');
        }
    })
}

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
    pc.createPage(subPageName, undefined, undefined, undefined, menuName);
    return pc;
}

const createExternalLink = () => {
    addNode({
        parentPathOrId: `/sites/${siteKey}/home`,
        primaryNodeType: 'jnt:externalLink',
        name: 'jahia-com',
        properties: [{name: 'jcr:title', value: externalLinkName, language: 'en'}, {name: 'j:url', value: 'http://www.jahia.com'}]
    });
}

describe('Advanced page testsuite', () => {
    before('Create site', () => {
        cy.login();
        deleteSite(siteKey);
        deleteUser(userName);
        deleteUser(adminName);
        cy.logout();

        cy.login();
        createSite(siteKey);
        createUser(userName, 'password');
        createUser(adminName, 'password');
        grantRoles(`/sites/${siteKey}`, ['editor-in-chief'], userName, 'USER');
        grantRoles(`/sites/${siteKey}`, ['site-administrator'], adminName, 'USER');
        cy.logout();
    })

    beforeEach('Visit and login', () => {
        cy.visit('/');
        cy.login(userName, 'password');
    })

    it('External link test', () => {
        PageComposer.visit(siteKey, 'en', 'home.html');
        cy.logout();
        cy.login(userName, 'password');
        createExternalLink();
        PageComposer.previewVisit(siteKey, 'en', 'home.html');
        cy.get('a:contains("Jahia.com")').click();
        cy.url().should('include', 'www.jahia.com');

        deleteNode(`/sites/${siteKey}/home/jahia-com`);
    })

    it('Menu title test', () => {
        const pc = createMenuAndSubPage();
        PageComposer.previewVisit(siteKey, 'en', 'home.html');
        cy.get(`li:contains("${menuName}")`).trigger('onmouseover');
        cy.get(`li:contains("${menuName}")`).trigger('mouseenter');
        cy.get(`li:contains("${menuName}") ul`).invoke('show');
        cy.get(`li:contains("${menuName}") ul li a:contains("${subPageName}")`).should('be.visible').click();
        cy.url().should('include', 'home/menu-title/my-sub-page.html');

        deleteNode(`/sites/${siteKey}/home/menu-title`);
    })

    it('Basic Lock/Unlock', () => {
        const pc = createMenuAndSubPage();
        PageComposer.visit(siteKey, 'en', 'home/menu-title/my-sub-page.html');
        let menu = pc.openContextualMenuOnLeftTree(subPageName);
        menu.lock();
        pc.leftTreeRefresh();
        pageIsLocked(subPageName);
        cy.logout();

        cy.login(adminName, 'password');
        PageComposer.visit(siteKey, 'en', 'home/menu-title/my-sub-page.html');
        pc.leftTreeRefresh();
        pageIsLocked(subPageName);
        menu = pc.openContextualMenuOnLeftTree(subPageName);

        const ce = new ContentEditor;
        menu.edit();
        cy.get('[data-sel-role="read-only-badge"]').should('be.visible');
        cy.get('[data-sel-role="lock-info-badge"]').contains(userName).should('be.visible');
        ce.cancel();
        cy.reload();
        menu = pc.openContextualMenuOnLeftTree(subPageName);
        menu.actionShouldntBeDisplayed('Unlock');
        cy.logout();

        cy.login(userName, 'password');
        PageComposer.visit(siteKey, 'en', 'home/menu-title/my-sub-page.html');
        menu = pc.openContextualMenuOnLeftTreeUntil(subPageName, 'Unlock');
        menu.unlock();
        pc.leftTreeRefresh();
        pageIsLocked(subPageName, true);
    })

    it('Lock/Clear lock', () => {
        createExternalLink();
        getNodeByPath(`/sites/${siteKey}/home`).then(home => {
            addNode({
                parentPathOrId: `/sites/${siteKey}/home`,
                primaryNodeType: 'jnt:nodeLink',
                name: 'internal-home',
                properties: [{name: 'jcr:title', value: 'internalHome', language: 'en'}, {name: 'j:node', value: home.data.jcr.nodeByPath.uuid}]
            })
        })
        const pc = createMenuAndSubPage();
        cy.login();
        PageComposer.visit(siteKey, 'en', 'home.html');
        let menu = pc.openContextualMenuOnLeftTree('Home');
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

        cy.login(adminName, 'password');
        PageComposer.visit(siteKey, 'en', 'home.html');
        pageIsLocked('Home', true);
        pageIsLocked(internalLinkName, true);
        pageIsLocked(externalLinkName, true);
        pageIsLocked(menuName, true);
        menu = pc.openContextualMenuOnLeftTree('Home');
        menu.edit();
        cy.get('[data-sel-role="read-only-badge"]').should('not.exist');
        cy.get('[data-sel-role="lock-info-badge"]').should('not.exist');
        const ce = new ContentEditor;
        cy.get('[id="jnt:page_jcr:title"]').clear({force: true}).type('test', {force: true});
        ce.cancel();

        PageComposer.visit(siteKey, 'en', 'home.html');
        menu = pc.openContextualMenuOnLeftTree(internalLinkName);
        menu.edit();
        cy.get('[data-sel-role="read-only-badge"]').should('not.exist');
        cy.get('[data-sel-role="lock-info-badge"]').should('not.exist');
        cy.get('[id="jnt:nodeLink_jcr:title"]').clear({force: true}).type('test', {force: true});
        ce.cancel();
    })

    afterEach('logout', () => {
        cy.logout();
    })





    after('Delete site and users', () => {
        
    })
})