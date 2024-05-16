import { graphql } from '@octokit/graphql';
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const run = async () => {
  // Calculate the start and end dates for the current week
  const today = new Date();
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
  const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6)); // Saturday

  const firstDay = firstDayOfWeek.toISOString().split('T')[0];
  const lastDay = lastDayOfWeek.toISOString().split('T')[0];

  const searchQuery = `repo:matos61/Pull_Request_testing is:pr created:${firstDay}..${lastDay}`;
  const token = process.env.GITHUB_TOKEN;

  console.log(`Using GitHub token: ${token ? 'Provided' : 'Not provided'}`);
  console.log(`Search Query: ${searchQuery}`);

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
              commits(last: 1) {
                totalCount
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
              reviews(first: 10) {
                nodes {
                  state
                  author {
                    login
                  }
                  submittedAt
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

  try {
    const response = await graphql({
      query,
      searchQuery,
      headers: {
        authorization: `token ${token}`,
      },
      request: {
        fetch,
      },
    });

    const prData = response.search.edges.map(edge => edge.node);
    console.log('Fetched PR Data:', JSON.stringify(prData, null, 2));

    writeFileSync('prs.json', JSON.stringify(prData, null, 2));
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    process.exit(1);
  }
};

run().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
