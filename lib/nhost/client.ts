/**
 * lib/nhost/client.ts
 *
 * Browser-side Nhost client singleton. Handles auth (sign up / sign in / sign
 * out), session persistence (localStorage), and automatic JWT refresh.
 *
 * Configuration is read from public env vars. If NEXT_PUBLIC_NHOST_SUBDOMAIN /
 * NEXT_PUBLIC_NHOST_REGION are not set, we derive them from the GraphQL URL
 * (https://{subdomain}.hasura.{region}.nhost.run/v1/graphql) so existing
 * setups keep working without new env vars.
 */
import { createClient, type NhostClient } from "@nhost/nhost-js";

function resolveConfig(): { subdomain: string; region: string } {
  const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN;
  const region = process.env.NEXT_PUBLIC_NHOST_REGION;

  if (subdomain && region) {
    return { subdomain, region };
  }

  // Fall back to parsing the GraphQL URL, e.g.
  // https://abcdefgh.hasura.us-west-2.nhost.run/v1/graphql
  const graphqlUrl = process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL;
  if (graphqlUrl) {
    const match = graphqlUrl.match(
      /^https?:\/\/([^.]+)\.hasura\.([^.]+)\.nhost\.run/i
    );
    if (match) {
      return { subdomain: match[1], region: match[2] };
    }
  }

  throw new Error(
    "Nhost config missing: set NEXT_PUBLIC_NHOST_SUBDOMAIN and " +
      "NEXT_PUBLIC_NHOST_REGION (or NEXT_PUBLIC_NHOST_GRAPHQL_URL) in your env."
  );
}

let client: NhostClient | null = null;

/**
 * Returns the shared Nhost client. Created lazily so the config error (if any)
 * surfaces at call time rather than at module import.
 */
export function getNhost(): NhostClient {
  if (!client) {
    const { subdomain, region } = resolveConfig();
    client = createClient({ subdomain, region });
  }
  return client;
}
