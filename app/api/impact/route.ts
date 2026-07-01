import { NextResponse } from "next/server";

const subdomain = process.env.NHOST_SUBDOMAIN;
const region = process.env.NHOST_REGION;
const adminSecret = process.env.NHOST_GRAPHQL_SECRET;
const graphqlUrl = `https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`;

export async function GET() {
  type MetricsResponse = {
    latest_project_metrics_aggregate: {
      aggregate: {
        sum: {
          total_views: number | null;
        };
      };
    };
  };

  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": adminSecret || "",
    },
    body: JSON.stringify({
      query: `query GetImpactMetrics {
        latest_project_metrics_aggregate {
          aggregate {
            sum {
              total_views
            }
          }
        }
      }`,
    }),
  });

  const result = (await response.json()) as { data?: MetricsResponse };
  const totalViews =
    result.data?.latest_project_metrics_aggregate?.aggregate?.sum?.total_views ?? 200000;

  return NextResponse.json({
    metrics: {
      dollarsRaised: 4220,
      peopleReached: totalViews,
    },
  });
}
