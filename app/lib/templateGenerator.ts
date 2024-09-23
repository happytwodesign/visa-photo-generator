import { jsPDF } from 'jspdf';

export async function generateTemplates(photoUrl: string): Promise<Blob[]> {
  const templates: Blob[] = [];

  const createTemplate = (width: number, height: number, photoWidth: number, photoHeight: number) => {
    const doc = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height]
    });

    // Add padding to the sides (e.g., 10mm on each side)
    const sidePadding = 10;
    const topBottomPadding = 10;

    // Add spacing between photos (e.g., 2mm)
    const spacing = 2;

    // Calculate the number of photos that can fit on the page with padding and spacing
    const cols = Math.floor((width - 2 * sidePadding + spacing) / (photoWidth + spacing));
    const rows = Math.floor((height - 2 * topBottomPadding + spacing) / (photoHeight + spacing));

    // Calculate margins to center the grid
    const marginX = (width - (cols * photoWidth + (cols - 1) * spacing)) / 2;
    const marginY = (height - (rows * photoHeight + (rows - 1) * spacing)) / 2;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        doc.addImage(
          photoUrl,
          'JPEG',
          marginX + j * (photoWidth + spacing),
          marginY + i * (photoHeight + spacing),
          photoWidth,
          photoHeight
        );
      }
    }

    return doc.output('blob');
  };

  // Generate templates for A4, A5, and A6
  // Using 35x45mm as the photo size
  templates.push(await createTemplate(210, 297, 35, 45)); // A4
  templates.push(await createTemplate(148, 210, 35, 45)); // A5
  templates.push(await createTemplate(105, 148, 35, 45)); // A6

  return templates;
}