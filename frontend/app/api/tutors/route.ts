import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_INTERNAL_URL;
const internalSecret = process.env.BACKEND_INTERNAL_SECRET;

export async function GET(request: NextRequest) {
  if (!backendUrl || !internalSecret) {
    return NextResponse.json({ error: "Tutor search is not configured." }, { status: 503 });
  }

  const response = await fetch(
    `${backendUrl}/api/backend/tutor-discovery?${request.nextUrl.searchParams.toString()}`,
    {
      headers: { "x-internal-secret": internalSecret },
      cache: "no-store",
    },
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
