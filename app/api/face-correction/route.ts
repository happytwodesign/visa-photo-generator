import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Your GET logic here
  return NextResponse.json({ message: 'Hello from face-correction API' });
}

export async function POST(request: Request) {
  // Your POST logic here
  const body = await request.json();
  return NextResponse.json({ message: 'Received data', data: body });
}
