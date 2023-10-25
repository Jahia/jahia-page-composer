import {BaseComponent, BasePage, Button, getComponent, getComponentByRole, getElement, MUIInput} from '@jahia/cypress';
import IframeOptions = Cypress.IframeOptions
import {PageComposerContextualMenu} from './pageComposer/pageComposerContextualMenu';
import {ContentEditor} from '@jahia/content-editor-cypress/dist/page-object/contentEditor';
import 'cypress-wait-until';
import {recurse} from 'cypress-recurse';

export class PageComposer extends BasePage {
    iFrameOptions: IframeOptions;

    constructor() {
        super();
        this.iFrameOptions = {timeout: 90000, log: true};
    }

    static visit(site: string, language: string, path: string): PageComposer {
        cy.visit(`/jahia/page-composer/default/${language}/sites/${site}/${path}`, {retryOnStatusCodeFailure: true});
        return new PageComposer();
    }

    static previewVisit(site: string, language: string, path: string): PageComposer {
        cy.visit(`/cms/render/default/${language}/sites/${site}/${path}`);
        return new PageComposer();
    }

    openCreateContent(): PageComposer {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.iframe('.gwt-Frame', this.iFrameOptions).within(() => {
                cy.get('.container').contains('Any content').click();
            });
        });
        return this;
    }

    createContent(contentType: string): ContentEditor {
        this.openCreateContent()
            .getContentTypeSelector()
            .searchForContentType(contentType)
            .selectContentType(contentType)
            .create();
        return new ContentEditor();
    }

    refresh() {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.get('.window-actions-refresh').click();
        });
        return this;
    }

    shouldContain(text: string) {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.iframe('.gwt-Frame', this.iFrameOptions).within(() => {
                cy.get('.container').should('contain', text);
            });
        });
    }

    componentShouldBeVisible(selector: string) {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.iframe('.gwt-Frame', this.iFrameOptions).within(() => {
                cy.get('.container').find(selector).scrollIntoView();
            });
        });
    }

    editComponent(selector: string) {
        this.openContextualMenuOnContent(selector).edit();
        // Cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
        //     cy.iframe('.gwt-Frame', this.iFrameOptions).within(() => {
        //         // eslint-disable-next-line
        //         cy.wait(5000)
        //         cy.get('.container').find(selector).trigger('mouseover').con({force: true});
        //     });
        // });
        // cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
        //     cy.get('.editModeContextMenu').scrollIntoView();
        //     cy.get('.editModeContextMenu').contains('Edit').click();
        // });
        return new ContentEditor();
    }

    editComponentByText(text: string): ContentEditor {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.iframe('.gwt-Frame', this.iFrameOptions).within(() => {
                // eslint-disable-next-line
                cy.wait(5000)
                cy.get('.container').contains(text).trigger('mouseover');
                cy.get('.container').contains(text).rightclick({force: true});
            });
        });
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.get('.editModeContextMenu').scrollIntoView();
            cy.get('.editModeContextMenu').contains('Edit').click();
        });
        return new ContentEditor();
    }

    getContentTypeSelector(): ContentTypeSelector {
        return getComponent(ContentTypeSelector);
    }

    shouldContainWIPOverlay() {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.iframe('.gwt-Frame', this.iFrameOptions).within(() => {
                cy.get('.workinprogress-overlay').should('contain', 'Work in progress');
            });
        });
    }

    editPage(title: string): ContentEditor {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.get('#JahiaGxtPagesTab').contains(title).rightclick({force: true});
            cy.get('.pagesContextMenuAnthracite').contains('Edit').click({force: true});
        });
        return new ContentEditor();
    }

    createPage(title: string, {systemName, save = true, template = 'home', under = 'Home'}: {systemName?: string, save?: boolean, template?: string, under?: string}): ContentEditor {
        const ce = new ContentEditor();
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.get('#JahiaGxtPagesTab').contains(under).rightclick({force: true});
            cy.get('.pagesContextMenuAnthracite').contains('New page').click({force: true});
        });

        cy.get('#jnt\\:page_jcr\\:title').type(title, {force: true});

        if (systemName) {
            cy.get('#nt\\:base_ce\\:systemName').clear({force: true});
            cy.get('#nt\\:base_ce\\:systemName').type(systemName, {force: true});
        }

        cy.get('#select-jmix\\:hasTemplateNode_j\\:templateName').should('be.visible').click();
        cy.get('#select-jmix\\:hasTemplateNode_j\\:templateName').find(`li[role="option"][data-value="${template}"]`).click();
        if (save) {
            ce.save();
        }

        return ce;
    }

    navigateToPage(name: string): PageComposer {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.get('#JahiaGxtPagesTab').contains(name).click({force: true});
        });

        return new PageComposer();
    }

    openContextualMenuOnContent(selector: string | number | symbol) {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.waitUntil(
                () => {
                    cy.iframe('.gwt-Frame', this.iFrameOptions).within(() => {
                        cy.get(selector).rightclick({force: true});
                    });
                    return cy.get('.editModeContextMenu').then(element => expect(element).to.be.not.null);
                },
                {
                    errorMsg: 'Menu not opened in required time',
                    timeout: 10000,
                    interval: 1000
                }
            );
        });

        return new PageComposerContextualMenu('.editModeContextMenu');
    }

    openContextualMenuOnLeftTree(entry: string) {
        cy.log('Open contextual manu on ' + entry + ' entry');

        cy.iframe('#page-composer-frame', this.iFrameOptions).should('be.visible').within(() => {
            cy.waitUntil(
                () => {
                    cy.get('#JahiaGxtPagesTab').contains(entry).rightclick({force: true, waitForAnimations: true});
                    return cy.get('.pagesContextMenuAnthracite', {timeout: 10000}).should('be.visible').then(element => expect(element).to.be.not.null);
                },
                {
                    errorMsg: 'Menu not opened in required time',
                    timeout: 90000,
                    interval: 1000
                }
            );
        });
        return new PageComposerContextualMenu('.pagesContextMenuAnthracite');
    }

    openContextualMenuOnLeftTreeUntil(entry: string, action: string) {
        cy.log('Open contextual manu on ' + entry + ' entry');

        cy.iframe('#page-composer-frame', this.iFrameOptions).should('be.visible').within(() => {
            recurse(
                () => cy.get('#JahiaGxtPagesTab').contains(entry).rightclick({force: true}),
                () => {
                    const elements = Cypress.$('#page-composer-frame')
                        .contents()
                        .find(`span[class *= "x-menu-item"]:contains("${action}"):not(:contains("${action} ")):visible`);
                    if (elements.length > 0) {
                        return true;
                    }

                    return false;
                },
                {
                    timeout: 90000
                }
            );
        });
        return new PageComposerContextualMenu('.pagesContextMenuAnthracite');
    }

    openContextualMenuOnContentUntil(selector: string | number | symbol, action: string) {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            recurse(
                () =>
                    cy.iframe('.gwt-Frame', this.iFrameOptions).within(() => {
                        cy.get(selector).rightclick({force: true});
                    }),
                () => {
                    const elements = Cypress.$('#page-composer-frame')
                        .contents()
                        .find(`span[class *= "x-menu-item"]:contains("${action}"):not(:contains("${action} ")):visible`);
                    if (elements.length > 0) {
                        return true;
                    }

                    return false;
                },
                {
                    timeout: 90000
                }
            );
        });
        return new PageComposerContextualMenu('.editModeContextMenu');
    }

    leftTreeRefresh() {
        cy.iframe('#page-composer-frame', this.iFrameOptions).within(() => {
            cy.get('#JahiaGxtRefreshSidePanelButton').click();
        });
    }
}

export class ContentTypeSelector extends BaseComponent {
    static defaultSelector = 'div[aria-labelledby="dialog-createNewContent"]';

    searchInput = getComponentByRole(MUIInput, 'content-type-dialog-input', this);

    searchForContentType(contentType: string): ContentTypeSelector {
        this.searchInput.type(contentType);
        return this;
    }

    selectContentType(contentType: string): ContentTypeSelector {
        getElement('[data-sel-role="content-type-tree"] span', this).contains(contentType).click();
        return this;
    }

    cancel(): void {
        getComponentByRole(Button, 'content-type-dialog-cancel', this).click();
    }

    create(): ContentEditor {
        getComponentByRole(Button, 'content-type-dialog-create', this).click();
        return new ContentEditor();
    }
}
