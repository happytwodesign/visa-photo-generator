import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const photoUrl = req.nextUrl.searchParams.get('url');
  const format = req.nextUrl.searchParams.get('format');

  if (!photoUrl || !format) {
    return NextResponse.json({ error: 'Photo URL and format are required' }, { status: 400 });
  }

  // Implement logic to generate the template with the photo and return it as a downloadable file
  // This is a placeholder implementation
  return new NextResponse('Template data', {
    headers: {
      'Content-Disposition': `attachment; filename="schengen_photo_template_${format}.pdf"`,
      'Content-Type': 'application/pdf',
    },
  });
}