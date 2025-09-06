import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker with better error handling and fallbacks
let workerSetupPromise: Promise<void> | null = null;

const setupWorker = async (): Promise<void> => {
  if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
    return; // Already set up
  }

  const workerSources = [
    // Try local worker first (if available)
    `/pdfjs/pdf.worker.min.js`,
    // Then try CDN sources
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
  ];

  // Try each worker source until one works
  for (const workerSrc of workerSources) {
    try {
      // Test if the worker can be loaded
      const response = await fetch(workerSrc, { method: "HEAD" });
      if (response.ok) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        console.log(`PDF.js worker loaded from: ${workerSrc}`);
        return;
      }
    } catch (error) {
      console.warn(`Failed to load worker from ${workerSrc}:`, error);
      continue;
    }
  }

  // If all sources fail, use the first one as fallback
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0];
  console.warn("Using fallback PDF.js worker source");
};

if (typeof window !== "undefined") {
  // Set immediate fallback worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.min.js`;

  // Then try to find a better source asynchronously
  workerSetupPromise = setupWorker().catch((error) => {
    console.error("Failed to set up PDF.js worker:", error);
  });
}

export interface PDFPageInfo {
  width: number;
  height: number;
  scale: number;
}

export async function renderPDFToCanvas(
  pdfData: string | ArrayBuffer,
  pageNumber: number = 1,
  targetWidth?: number,
  targetHeight?: number
): Promise<{ canvas: HTMLCanvasElement; pageInfo: PDFPageInfo }> {
  try {
    // Ensure worker is set up before loading PDF
    if (workerSetupPromise) {
      await workerSetupPromise;
    }

    // Double-check worker is configured
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Set a fallback worker source if none is configured
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.min.js`;
    }

    console.log(
      "PDF.js worker source:",
      pdfjsLib.GlobalWorkerOptions.workerSrc
    );

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    // Get the specified page
    const page = await pdf.getPage(pageNumber);

    // Calculate scale based on target dimensions or use default
    const viewport = page.getViewport({ scale: 1.0 });

    let scale: number;
    if (targetWidth && targetHeight) {
      // Use target dimensions to calculate scale (same logic as canvas editor)
      const scaleX = targetWidth / viewport.width;
      const scaleY = targetHeight / viewport.height;
      scale = Math.min(scaleX, scaleY);
    } else {
      // Fallback to original logic
      const maxWidth = 800;
      const maxHeight = 600;
      const scaleX = maxWidth / viewport.width;
      const scaleY = maxHeight / viewport.height;
      scale = Math.min(scaleX, scaleY, 2.0); // Cap at 2x for performance
    }

    const scaledViewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Render the page
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
      canvas: canvas,
    };

    await page.render(renderContext).promise;

    return {
      canvas,
      pageInfo: {
        width: scaledViewport.width,
        height: scaledViewport.height,
        scale,
      },
    };
  } catch (error) {
    console.error("Error rendering PDF:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("worker")) {
        throw new Error(
          "PDF worker failed to load. Please try refreshing the page."
        );
      } else if (error.message.includes("Invalid PDF")) {
        throw new Error(
          "Invalid PDF file. Please ensure the file is a valid PDF."
        );
      } else if (error.message.includes("password")) {
        throw new Error(
          "PDF is password protected. Please use an unprotected PDF."
        );
      } else {
        throw new Error(`PDF rendering failed: ${error.message}`);
      }
    } else {
      throw new Error("Failed to render PDF. Please try again.");
    }
  }
}

export async function getPDFPageCount(
  pdfData: string | ArrayBuffer
): Promise<number> {
  try {
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    return pdf.numPages;
  } catch (error) {
    console.error("Error getting PDF page count:", error);
    return 1;
  }
}
