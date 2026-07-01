const subdomain = process.env.NHOST_SUBDOMAIN;
const region = process.env.NHOST_REGION;
const adminSecret = process.env.NHOST_GRAPHQL_SECRET;

if (!subdomain || !region) {
  throw new Error("Missing NHOST_SUBDOMAIN or NHOST_REGION environment variables");
}

export const nhost = {
  subdomain,
  region,
  adminSecret,
  graphqlUrl: `https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`,
  authUrl: `https://${subdomain}.auth.${region}.nhost.run/v1`,
  storageUrl: `https://${subdomain}.storage.${region}.nhost.run/v1`,
  functionsUrl: `https://${subdomain}.functions.${region}.nhost.run/v1`,
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type GraphQLOptions = {
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  useAdminSecret?: boolean;
};

export async function graphql<T = unknown>(
  query: string,
  options: GraphQLOptions = {}
): Promise<GraphQLResponse<T>> {
  const { variables, headers = {}, useAdminSecret = false } = options;

  if (useAdminSecret && nhost.adminSecret) {
    headers["x-hasura-admin-secret"] = nhost.adminSecret;
  }

  const response = await fetch(nhost.graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
    // Never let Next's Data Cache persist GraphQL responses — it would otherwise
    // serve a stale result (e.g. a "table not found" error cached before a migration).
    cache: "no-store",
  });

  return response.json() as Promise<GraphQLResponse<T>>;
}

export async function callFunction(
  name: string,
  data?: unknown,
  headers?: Record<string, string>
): Promise<Response> {
  return fetch(`${nhost.functionsUrl}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}
