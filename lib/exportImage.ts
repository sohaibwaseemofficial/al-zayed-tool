import html2canvas from 'html2canvas-pro';

export async function exportElementTo3xHDPNG(
  element: HTMLElement,
  filename: string
): Promise<boolean> {
  try {
    // Ensure element is visible and styled properly
    const canvas = await html2canvas(element, {
      scale: 3, // 3x ultra-sharp resolution requested
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // Ensure fonts and inputs look crisp in print clone
        const inputs = clonedDoc.querySelectorAll('input, textarea, select');
        inputs.forEach((inp: any) => {
          if (inp.type === 'checkbox') {
            // keep checked state
          } else {
            inp.style.border = 'none';
            inp.style.background = 'transparent';
          }
        });
      },
    });

    // Create download link
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Failed to export 3x HD PNG:', error);
    throw error;
  }
}
