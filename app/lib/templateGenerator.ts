import { jsPDF } from 'jspdf';

const PHOTO_WIDTH_MM = 35;
const PHOTO_HEIGHT_MM = 45;

function createTemplate(format: 'a4' | 'a5' | 'a6', imageDataUrl: string): Promise<Blob> {
  return new Promise((resolve) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: format
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const cols = Math.floor(pageWidth / PHOTO_WIDTH_MM);
    const rows = Math.floor(pageHeight / PHOTO_HEIGHT_MM);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        doc.addImage(
          imageDataUrl,
          'JPEG',
          j * PHOTO_WIDTH_MM,
          i * PHOTO_HEIGHT_MM,
          PHOTO_WIDTH_MM,
          PHOTO_HEIGHT_MM
        );
      }
    }

    doc.save(`schengen_visa_photo_${format}.pdf`);
    resolve(doc.output('blob'));
  });
}

export async function generateTemplates(imageDataUrl: string): Promise<Blob[]> {
  const a4Template = await createTemplate('a4', imageDataUrl);
  const a5Template = await createTemplate('a5', imageDataUrl);
  const a6Template = await createTemplate('a6', imageDataUrl);

  return [a4Template, a5Template, a6Template];
}