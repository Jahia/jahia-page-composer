import {
    abortAllWorkflows,
    createSite,
    createUser,
    deleteSite,
    deleteUser,
    grantRoles,
    publishAndWaitJobEnding,
    setNodeProperty,
    startWorkflow,
    unpublishNode,
} from '@jahia/cypress'
import { PageComposer } from '../page-object/pageComposer'

const siteKey = 'jahiaUserLanguageSite'
const editorLogin = 'jahiaUserLanguageEditor'
const editorPassword = 'password'
const publisherLogin = 'jahiaUserLanguagePublisher'
const publisherPassword = 'password'

const expect404 = (url: string) => {
    cy.request({
        url: url,
        failOnStatusCode: false,
    }).then((response) => {
        expect(response.status).to.eq(404)
    })
}

const expect404InAllLanguages = (page: string) => {
    expect404(`/en/sites/${siteKey}/home/${page}.html`)
    expect404(`/fr/sites/${siteKey}/home/${page}.html`)
    expect404(`/es/sites/${siteKey}/home/${page}.html`)
}

describe('Jahia user language 1 testsuite: A page should not be available when marked for deletion/deleted/unpublished', () => {
    before('Create sites/users', () => {
        createSite(siteKey, {
            languages: 'en,fr,es',
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })

        createUser(editorLogin, editorPassword)
        createUser(publisherLogin, publisherPassword)
        grantRoles(`/sites/${siteKey}`, ['editor'], editorLogin, 'USER')
        grantRoles(`/sites/${siteKey}`, ['publisher'], publisherLogin, 'USER')
        publishAndWaitJobEnding(`/sites/${siteKey}`, ['en', 'fr', 'es'])
    })

    it('Jahia user language 1 test: A page should not be available when marked for deletion/deleted/unpublished', () => {

        cy.login(editorLogin, editorPassword)
        const pageComposer = new PageComposer()
        PageComposer.visit(siteKey, 'en', 'home.html')
        pageComposer.createPage('PageEN')
        PageComposer.visit(siteKey, 'fr', 'home.html')
        setNodeProperty(`/sites/${siteKey}/home`, 'jcr:title', 'Home', 'fr')
        pageComposer.createPage('PageFR')
        publishAndWaitJobEnding(`/sites/${siteKey}/home/pagefr`, ['fr'])
        cy.logout()

        cy.visit(`/fr/sites/${siteKey}/home/pagefr.html`)
        expect404(`/en/sites/${siteKey}/home/pageen.html`)

        cy.login(publisherLogin, publisherPassword)
        unpublishNode(`/sites/${siteKey}/home/pagefr`, 'fr')
        cy.logout()

        expect404InAllLanguages('pagefr')

        cy.login(editorLogin, editorPassword)
        startWorkflow(`/sites/${siteKey}/home/pagefr`, 'jBPM:2-step-publication', 'fr')
        cy.logout()

        expect404InAllLanguages('pagefr')

        cy.login(publisherLogin, publisherPassword)
        abortAllWorkflows()
        expect404InAllLanguages('pagefr')
        cy.logout()

        expect404InAllLanguages('pagefr')
    })

    after('Delete site/users', () => {
        deleteSite(siteKey)
        deleteUser(editorLogin)
        deleteUser(publisherLogin)
    })
})
