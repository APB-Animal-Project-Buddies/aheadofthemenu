import { NextResponse } from "next/server";

const subdomain = process.env.NHOST_SUBDOMAIN;
const region = process.env.NHOST_REGION;
const adminSecret = process.env.NHOST_GRAPHQL_SECRET;
const graphqlUrl = `https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": adminSecret || "",
      },
      body: JSON.stringify({
        query: `query KeepAlive { projects(limit: 1) { project_handle } }`,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, status: response.status },
        { status: 502 },
      );
    }

    const result = (await response.json()) as {
      data?: unknown;
      errors?: Array<{ message: string }>;
    };

    if (result.errors && result.errors.length > 0) {
      return NextResponse.json(
        { ok: false, error: result.errors[0]?.message },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 502 },
    );
  }
}
