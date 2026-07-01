import { NextResponse } from "next/server";

const subdomain = process.env.NHOST_SUBDOMAIN;
const region = process.env.NHOST_REGION;
const adminSecret = process.env.NHOST_GRAPHQL_SECRET;
const graphqlUrl = `https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`;

export const dynamic = "force-dynamic";

export async function GET() {
  type ProjectsResponse = {
    projects: Array<{
      project_handle: string;
      project_name: string | null;
      project_website: string | null;
      project_description: string | null;
    }>;
  };

  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": adminSecret || "",
    },
    body: JSON.stringify({
      query: `query GetProjects {
        projects(order_by: { project_handle: asc }) {
          project_handle
          project_name
          project_website
          project_description
        }
      }`,
    }),
  });

  const result = (await response.json()) as { data?: ProjectsResponse; errors?: Array<{ message: string }> };

  if (result.errors && result.errors.length > 0) {
    return NextResponse.json({ error: result.errors[0]?.message }, { status: 500 });
  }

  return NextResponse.json({ projects: result.data?.projects ?? [] });
}
