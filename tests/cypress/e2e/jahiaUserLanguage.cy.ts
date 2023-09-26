import {
    abortAllWorkflows,
    createSite,
    createUser,
    deleteNode,
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

const jahiaUserLanguageTest = (language: string) => {
    cy.login(editorLogin, editorPassword)
    const pageComposer = new PageComposer()
    PageComposer.visit(siteKey, 'en', 'home.html')
    pageComposer.createPage('PageEN')
    PageComposer.visit(siteKey, language, 'home.html')
    setNodeProperty(`/sites/${siteKey}/home`, 'jcr:title', 'Home', language)
    pageComposer.createPage(`Page${language.toUpperCase()}`)
    publishAndWaitJobEnding(`/sites/${siteKey}/home/page${language}`, [language])
    cy.logout()

    cy.visit(`/${language}/sites/${siteKey}/home/page${language}.html`)
    expect404(`/en/sites/${siteKey}/home/pageen.html`)

    cy.login(publisherLogin, publisherPassword)
    unpublishNode(`/sites/${siteKey}/home/page${language}`, language)
    cy.logout()

    expect404InAllLanguages(`page${language}`)

    cy.login(editorLogin, editorPassword)
    startWorkflow(`/sites/${siteKey}/home/page${language}`, 'jBPM:2-step-publication', language)
    cy.logout()

    expect404InAllLanguages(`page${language}`)

    cy.login(publisherLogin, publisherPassword)
    abortAllWorkflows()
    expect404InAllLanguages(`page${language}`)
    cy.logout()

    expect404InAllLanguages(`page${language}`)
}

describe('A page should not be available when marked for deletion/deleted/unpublished', () => {
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

    it('A page should not be available when marked for deletion/deleted/unpublished in french', () => {
        jahiaUserLanguageTest('fr')
        deleteNode(`/sites/${siteKey}/home/pagefr`)
        deleteNode(`/sites/${siteKey}/home/pageen`)
        deleteNode(`/sites/${siteKey}/home/pagees`)
        publishAndWaitJobEnding(`/sites/${siteKey}`, ['en', 'fr', 'es'])
    })

    it('A page should not be available when marked for deletion/deleted/unpublished in spanish', () => {
        jahiaUserLanguageTest('es')
        deleteNode(`/sites/${siteKey}/home/pagefr`)
        deleteNode(`/sites/${siteKey}/home/pageen`)
        deleteNode(`/sites/${siteKey}/home/pagees`)
        publishAndWaitJobEnding(`/sites/${siteKey}`, ['en', 'fr', 'es'])
    })

    after('Delete site/users', () => {
        deleteSite(siteKey)
        deleteUser(editorLogin)
        deleteUser(publisherLogin)
    })
})
