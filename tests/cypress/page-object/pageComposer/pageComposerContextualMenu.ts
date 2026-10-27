import {BasePage} from '@jahia/cypress';
import IframeOptions = Cypress.IframeOptions

export enum ExportType {
    XML = 'Export XML',
    ZIP = 'Export Zip',
    ZIP_LIVE = 'Export Zip with live content',
}
export class PageComposerContextualMenu extends BasePage {
    iFrameOptions: IframeOptions;
    contextMenuId: string;

    constructor(contextMenuId: string) {
        super();
        this.contextMenuId = contextMenuId;
    }

    copy(): Cypress.Chainable {
        return this.execute('Copy');
    }

    cut(): Cypress.Chainable {
        return this.execute('Cut');
    }

    paste(): Cypress.Chainable {
        // GWT reports a failed paste with Window.alert(); Cypress only handles dialogs of the top window,
        // so an unstubbed alert in the frame blocks the browser and the run hangs without any timeout
        cy.get('#page-composer-frame').its('0.contentWindow').then(win => {
            cy.stub(win, 'alert').as('pasteAlert');
        });
        cy.intercept('POST', '**/gwt/contentManager.gwt*', req => {
            if (typeof req.body === 'string' && req.body.includes('|paste|')) {
                req.alias = 'paste';
            }
        });
        this.execute('Paste');
        // The copy is saved before the RPC returns: wait for it, or the caller may delete the copy mid-paste
        return cy.wait('@paste', {timeout: 60000}).then(interception => {
            expect(interception.response?.body, 'GWT paste response').to.match(/^\/\/OK/);
        });
    }

    delete() {
        return this.execute('Delete');
    }

    undelete() {
        return this.execute('Undelete');
    }

    edit() {
        return this.execute('Edit');
    }

    lock() {
        return this.execute('Lock');
    }

    unlock() {
        return this.execute('Unlock');
    }

    newPage() {
        return this.execute('New page');
    }

    clearLock(childs?: boolean) {
        if (childs) {
            return this.execute('Clear lock on node and children');
        }

        return this.execute('Clear lock on node');
    }

    execute(action: string): Cypress.Chainable {
        cy.log('Execute action: ' + action);
        return cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.get(this.contextMenuId).contains(action).click({force: true});
        });
    }

    actionShouldntBeDisplayed(action: string) {
        cy.log(`Action ${action} shouldn't be dispalyed`);
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.get(this.contextMenuId).contains(action).should('not.be.visible');
        });
    }

    actionShouldBeDisplayed(action: string) {
        cy.log(`Action ${action} should be dispalyed`);
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.get(this.contextMenuId, {timeout: 90000}).contains(action).should('be.visible');
        });
    }
}
