export class GraphqlUtils {
    public static deleteNode = (pathOrId: string) => {
        cy.apollo({
            variables: {
                pathOrId: pathOrId,
            },
            mutationFile: 'graphql/jcrDeleteNode.graphql',
        }).then((result) => {
            expect(result?.data?.jcr?.deleteNode).to.eq(true)
        })
    }

    public static getNode = (path: string, property?: string, language?: string, expectProperty?: string) => {
        if (property && expectProperty && language) {
            cy.apollo({
                variables: {
                    path: path,
                    properties: [property],
                    language: language,
                },
                queryFile: 'graphql/jcrGetNode.graphql',
            }).then((result) => {
                expect(result?.data?.jcr?.nodeByPath?.name).to.eq(path.split('/').pop())
                expect(result?.data?.jcr?.nodeByPath?.properties[0].value).to.eq(expectProperty)
            })
        } else {
            cy.apollo({
                variables: {
                    path: path,
                },
                queryFile: 'graphql/jcrGetNode.graphql',
            }).then((result) => {
                expect(result?.data?.jcr?.nodeByPath?.name).to.eq(path.split('/').pop())
            })
        }
    }

    public static setProperty = (pathOrId: string, property: string, value: string, language: string) => {
        cy.apollo({
            variables: {
                pathOrId: pathOrId,
                property: property,
                value: value,
                language: language,
            },
            mutationFile: 'graphql/jcrSetProperty.graphql',
        }).then((result) => {
            expect(result?.data?.jcr?.mutateNode?.mutateProperty?.setValue).to.eq(true)
        })
    }

    public static deleteProperty = (pathOrId: string, property: string, language: string) => {
        cy.apollo({
            variables: {
                pathOrId: pathOrId,
                property: property,
                language: language,
            },
            mutationFile: 'graphql/jcrDeleteProperty.graphql',
        }).then((result) => {
            expect(result?.data?.jcr?.mutateNode?.mutateProperty?.delete).to.eq(true)
        })
    }

    public static addVanityUrl = (pathOrId: string, language: string, url: string) => {
        cy.apollo({
            variables: {
                pathOrId: pathOrId,
                language: language,
                url: url,
            },
            mutationFile: 'graphql/jcrAddvanityUrl.graphql',
        }).then((result) => {
            expect(result?.data?.jcr?.mutateNode?.addVanityUrl[0]?.uuid).not.eq(undefined)
        })
    }

    public static getVanityUrl = (path: string, languages: Array<string>, expected: string) => {
        cy.apollo({
            variables: {
                path: path,
                languages: languages,
            },
            queryFile: 'graphql/jcrGetVanityUrls.graphql',
        }).then((result) => {
            expect(result?.data?.jcr?.nodeByPath?.vanityUrls[0]?.url).to.eq(expected)
        })
    }

    public static removeVanityUrl = (pathOrId: string, url: string) => {
        cy.apollo({
            variables: {
                pathOrId: pathOrId,
                url: url,
            },
            mutationFile: 'graphql/jcrRemoveVanityUrl.graphql',
        }).then((result) => {
            expect(result?.data?.jcr?.mutateNode?.mutateVanityUrl?.delete).to.eq(true)
        })
    }
}
