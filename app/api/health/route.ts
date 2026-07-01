import { NextResponse } from "next/server";

const subdomain = process.env.NHOST_SUBDOMAIN;
const region = process.env.NHOST_REGION;

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    nhost: { region, subdomain },
  });
}
