import { createSite, createUser, deleteSite, deleteUser, grantRoles } from '@jahia/cypress'
import { ContentEditor } from '../page-object/contentEditor'
import { PageComposer } from '../page-object/pageComposer'

const siteKey = 'SystemNameReadOnlySite'
const userName = 'SystemNameEditor'
const userPassword = 'password'
const firstPageName = 'myPage'
const firstPageSysName = 'myPageTest'
const secondPageName = 'myPage2'
const secondPageSysName = 'myPageTest2'
const pageModelName = 'PageModel_testSystemNameReadOnlyInAreas'

const checkAreaMain = (pageName: string) => {
    const pageComposer = new PageComposer()
    pageComposer.navigateToPage(pageName)
    const ce = pageComposer.editComponent('div[id="JahiaGxtArea__area-main"]')
    cy.get('div[data-sel-content-editor-field-type="SystemName"]').find('input[value="area-main"]').should('be.visible')
    cy.get(
        'div[data-sel-content-editor-field-type="SystemName"][data-sel-content-editor-field-readonly="true"]',
    ).should('exist')
    ce.cancel()
}

describe('System name read only in areas testsuite', () => {
    before('Create site and user', () => {
        createSite(siteKey)
        createUser(userName, userPassword)
        grantRoles('/sites/' + siteKey, ['editor'], userName, 'USER')
    })

    it('System name read only in areas', () => {
        cy.login(userName, userPassword)
        const pageComposer = new PageComposer()
        PageComposer.visit(siteKey, 'en', 'home.html')
        pageComposer.createPage(firstPageName, firstPageSysName)
        checkAreaMain(firstPageName)
        let menu = pageComposer.openContextualMenuOnLeftTree(firstPageName)
        menu.edit()
        const ce = new ContentEditor()
        ce.setAsPageModel(pageModelName)
        cy.get('button[data-sel-role="submitSave"]').click()
        PageComposer.visit(siteKey, 'en', 'home.html')
        pageComposer.createPage(secondPageName, secondPageSysName, true, `/sites/${siteKey}/home/${firstPageSysName}`)
        cy.reload()
        checkAreaMain(secondPageName)
        menu = pageComposer.openContextualMenuOnContentUntil('div[id="JahiaGxtArea__area-main"]', 'Copy')
        menu.copy()
        menu = pageComposer.openContextualMenuOnContentUntil('div[id="JahiaGxtArea__landing"]', 'Paste')
        menu.paste()
        menu = pageComposer.openContextualMenuOnContentUntil(
            'div[path="/sites/SystemNameReadOnlySite/home/myPageTest2/landing/area-main"]>div:contains("No item found")',
            'Edit',
        )
        menu.edit()
        cy.get('div[data-sel-content-editor-field-type="SystemName"]')
            .find('input[value="area-main"]')
            .should('be.visible')
        cy.get(
            'div[data-sel-content-editor-field-type="SystemName"][data-sel-content-editor-field-readonly="true"]',
        ).should('exist')
        ce.cancel()
    })

    after('Delete site and user', () => {
        deleteSite(siteKey)
        deleteUser(userName)
    })
})
