import { PageComposer } from '../page-object/pageComposer'

describe('Page creation tests', () => {
    const site = 'pageComposerSite'
    const nameWithSpecialChars = "list'asasa'an@##$%#$%@#%"
    let pageComposer: PageComposer

    before(function () {
        cy.executeGroovy('createSite.groovy', { SITEKEY: site })
        cy.login()
    })

    after(function () {
        cy.logout()
        cy.executeGroovy('deleteSite.groovy', { SITEKEY: site })
    })

    beforeEach(function () {
        pageComposer = PageComposer.visit(site, 'en', 'home.html')
    })

    it.skip('Special characters are handled correctly in page name', function () {
        pageComposer.createPage(nameWithSpecialChars)
        PageComposer.visit(site, 'en', 'home.html')
        pageComposer.navigateToPage(nameWithSpecialChars)
        // TODO this will need to be changed to accommodate updated functionality
        // TODO TECH-1231 fix the test
        cy.get('h1').contains('Page not found')
    })
})
