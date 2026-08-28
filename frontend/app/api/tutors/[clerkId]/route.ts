import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_INTERNAL_URL;
const internalSecret = process.env.BACKEND_INTERNAL_SECRET;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clerkId: string }> },
) {
  if (!backendUrl || !internalSecret) {
    return NextResponse.json({ error: "Tutor profiles are not configured." }, { status: 503 });
  }

  const { clerkId } = await params;
  const response = await fetch(`${backendUrl}/api/backend/tutor-discovery/${encodeURIComponent(clerkId)}`, {
    headers: { "x-internal-secret": internalSecret },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
