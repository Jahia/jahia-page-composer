import { GraphqlUtils } from '../utils/graphqlUtils'
import { PageComposer } from '../page-object/pageComposer'

const checkDescriptions = (path: string) => {
    GraphqlUtils.getNode(path, 'jcr:description', 'en', "That's the description")
    GraphqlUtils.getNode(path, 'jcr:description', 'fr', "C'est la description")
}

describe('Copy Cut and Paste tests with page composer', () => {
    before('Create required content', () => {
        cy.login()
        cy.executeGroovy('createSite.groovy', { SITEKEY: 'testsite' })
        GraphqlUtils.setProperty('/sites/digitall/home/about', 'jcr:description', "That's the description", 'en')
        GraphqlUtils.setProperty('/sites/digitall/home/about', 'jcr:description', "C'est la description", 'fr')
        GraphqlUtils.addVanityUrl('/sites/digitall/home/about', 'en', '/about')
        cy.logout()
    })

    it('Copy and paste in another site', () => {
        const composer = new PageComposer()
        cy.login()
        cy.visit('/cms/edit/default/en/sites/digitall/home.html?redirect=false')
        composer.rightClick('About', 'Copy')
        cy.visit('/cms/edit/default/en/sites/testsite/home.html?redirect=false')
        composer.rightClick('Home', 'Paste').then(() => {
            checkDescriptions('/sites/testsite/home/about')
            GraphqlUtils.deleteNode('/sites/testsite/home/about')
        })
        cy.logout()
    })

    it('Copy and paste under the same site, same parent', () => {
        const composer = new PageComposer()
        cy.login()
        cy.visit('/cms/edit/default/en/sites/digitall/home.html?redirect=false')
        composer.rightClick('About', 'Copy')
        composer.rightClick('Home', 'Paste').then(() => {
            cy.reload()
            cy.get('div[class *= "x-grid3-row"]:contains("About")').should('have.length', 2)
            checkDescriptions('/sites/digitall/home/about-1')
            GraphqlUtils.getNode('/sites/digitall/home/about-1', 'jcr:title', 'en', 'About')
            GraphqlUtils.deleteNode('/sites/digitall/home/about-1')
        })
        cy.logout()
    })

    it('Copy and paste under the same site, other parent', () => {
        const composer = new PageComposer()
        cy.login()
        cy.visit('/cms/edit/default/en/sites/digitall/home.html?redirect=false')
        composer.rightClick('About', 'Copy')
        composer.rightClick('Newsroom', 'Paste').then(() => {
            cy.reload()
            checkDescriptions('/sites/digitall/home/newsroom/about')
            GraphqlUtils.getNode('/sites/digitall/home/newsroom/about', 'jcr:title', 'en', 'About')
            GraphqlUtils.deleteNode('/sites/digitall/home/newsroom/about')
        })
        cy.logout()
    })

    it("Cut and paste under another site / check vanity url isn't the same", () => {
        const composer = new PageComposer()
        cy.login()
        cy.visit('/cms/edit/default/en/sites/digitall/home.html?redirect=false')
        composer.rightClick('About', 'Cut')
        cy.visit('/cms/edit/default/en/sites/testsite/home.html?redirect=false')
        composer.rightClick('Home', 'Paste').then(() => {
            GraphqlUtils.getVanityUrl('/sites/testsite/home/about', ['en'], '/about')
        })
        composer.rightClick('About', 'Cut')
        cy.visit('/cms/edit/default/en/sites/digitall/home.html?redirect=false')
        composer.rightClick('Home', 'Paste')

        cy.logout()
    })

    after('Clean content', () => {
        cy.login()
        // cy.executeGroovy('deleteSite.groovy', { SITEKEY: 'testsite' })
        GraphqlUtils.deleteProperty('/sites/digitall/home/about', 'jcr:description', 'en')
        GraphqlUtils.deleteProperty('/sites/digitall/home/about', 'jcr:description', 'fr')
        GraphqlUtils.removeVanityUrl('/sites/digitall/home/about', '/about')
        cy.logout()
    })
})
