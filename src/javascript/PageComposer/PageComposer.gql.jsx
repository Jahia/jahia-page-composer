import gql from 'graphql-tag';
import {PredefinedFragments} from '@jahia/data-helper';

const GetHomePage = gql`
    query GetHomePageForPageComposer($path: String!) {
        jcr {
            nodeByPath(path: $path) {
                site {
                    homePage {
                        name
                        path
                        ...NodeCacheRequiredFields
                    }
                    ...NodeCacheRequiredFields
                }
                ...NodeCacheRequiredFields
            }
        }
    }
    ${PredefinedFragments.nodeCacheRequiredFields.gql}
`;

export {GetHomePage};
