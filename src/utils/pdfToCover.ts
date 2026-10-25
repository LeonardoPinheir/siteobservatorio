import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure local Vite-bundled worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Extracts the first page of a PDF file and returns it as a JPEG Data URL
 * suitable for use as a high-resolution book cover.
 */
export async function extractCoverFromPdf(pdfFile: File): Promise<string> {
  const arrayBuffer = await pdfFile.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);

  // Scale viewport to generate ~800px width for crisp cover rendering
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const targetWidth = 800;
  const scale = Math.max(1.0, Math.min(2.5, targetWidth / unscaledViewport.width));
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Não foi possível inicializar o contexto 2D para renderizar o PDF.');
  }

  // Render white background first (PDFs often have transparent backgrounds)
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  // @ts-expect-error pdfjs render interface compatibility
  await page.render(renderContext).promise;

  // Export as high quality JPEG
  return canvas.toDataURL('image/jpeg', 0.88);
}
