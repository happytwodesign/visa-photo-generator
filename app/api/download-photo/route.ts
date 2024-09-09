import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const photoUrl = req.nextUrl.searchParams.get('url');

  if (!photoUrl) {
    return NextResponse.json({ error: 'Photo URL is required' }, { status: 400 });
  }

  // Implement logic to fetch the photo and return it as a downloadable file
  // This is a placeholder implementation
  return new NextResponse('Photo data', {
    headers: {
      'Content-Disposition': 'attachment; filename="schengen_photo.jpg"',
      'Content-Type': 'image/jpeg',
    },
  });
}