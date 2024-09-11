import { jsPDF } from 'jspdf';

export async function generateTemplates(photoUrl: string): Promise<Blob[]> {
  const templates: Blob[] = [];

  // Function to create a template for a specific paper size
  const createTemplate = (width: number, height: number, photoWidth: number, photoHeight: number) => {
    const doc = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height]
    });

    // Calculate the number of photos that can fit on the page
    const cols = Math.floor(width / photoWidth);
    const rows = Math.floor(height / photoHeight);

    // Calculate margins to center the grid
    const marginX = (width - (cols * photoWidth)) / 2;
    const marginY = (height - (rows * photoHeight)) / 2;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        doc.addImage(
          photoUrl, 
          'JPEG', 
          marginX + j * photoWidth, 
          marginY + i * photoHeight, 
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