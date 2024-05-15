import { graphql } from '@octokit/graphql';
import { writeFileSync } from 'fs';

const run = async () => {
  const searchQuery = process.env.SEARCH_QUERY;
  const token = process.env.GITHUB_TOKEN;

  const query = `
    query ($searchQuery: String!) {
      search(query: $searchQuery, type: ISSUE, first: 100) {
        edges {
          node {
            ... on PullRequest {
              number
              title
              createdAt
              closedAt
              mergedAt
              commits {
                totalCount
              }
              reviews {
                nodes {
                  state
                  author {
                    login
                  }
                  submittedAt
                }
              }
              commits(last: 1) {
                nodes {
                  commit {
                    status {
                      contexts {
                        context
                        state
                      }
                    }
                  }
                }
              }
              reviewRequests(first: 10) {
                nodes {
                  requestedReviewer {
                    ... on User {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await graphql({
    query,
    searchQuery,
    headers: {
      authorization: `token ${token}`,
    },
  });

  writeFileSync('prs.json', JSON.stringify(response.search.edges.map(edge => edge.node), null, 2));
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
