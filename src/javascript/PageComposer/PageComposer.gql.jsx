import gql from 'graphql-tag';

const GetHomePage = gql`
query GetHomePage($query: String!){
   jcr {
    nodesByQuery(query: $query) {
      nodes {
        name
        path
      }
    }
  }
}   
`;

export {GetHomePage};
