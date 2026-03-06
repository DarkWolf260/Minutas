import { NextResponse } from 'next/server';

// Minimal health check: HEAD only to save bandwidth and prevent browser indexing/viewing
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
