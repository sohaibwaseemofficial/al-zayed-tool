import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export async function exportElementToPDF(
  element: HTMLElement,
  filename: string
): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL('image/png');
    // Determine orientation based on aspect ratio
    const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Maintain aspect ratio with a 5mm margin
    const margin = 5;
    const maxPdfWidth = pageWidth - margin * 2;
    const maxPdfHeight = pageHeight - margin * 2;

    const imgRatio = canvas.width / canvas.height;
    let renderWidth = maxPdfWidth;
    let renderHeight = maxPdfWidth / imgRatio;

    if (renderHeight > maxPdfHeight) {
      renderHeight = maxPdfHeight;
      renderWidth = maxPdfHeight * imgRatio;
    }

    const xPos = (pageWidth - renderWidth) / 2;
    const yPos = (pageHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'PNG', xPos, yPos, renderWidth, renderHeight, undefined, 'FAST');
    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
}
