/**
 * Utility functions for file processing
 */

/**
 * Convert ArrayBuffer to base64 string efficiently
 * Handles large files by processing in chunks to avoid call stack overflow
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error("Invalid ArrayBuffer provided");
  }

  const uint8Array = new Uint8Array(buffer);
  let binaryString = "";
  const chunkSize = 8192; // Process in chunks to avoid call stack overflow

  try {
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }

    return btoa(binaryString);
  } catch (error) {
    throw new Error(
      `Failed to convert ArrayBuffer to base64: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Convert base64 string to ArrayBuffer efficiently
 * Handles large files by processing in chunks
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (!base64 || base64.length === 0) {
    throw new Error("Invalid base64 string provided");
  }

  try {
    const binaryString = atob(base64);
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    // Process in chunks to avoid potential performance issues
    const chunkSize = 8192;
    for (let i = 0; i < binaryString.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, binaryString.length);
      for (let j = i; j < end; j++) {
        uint8Array[j] = binaryString.charCodeAt(j);
      }
    }

    return arrayBuffer;
  } catch (error) {
    throw new Error(
      `Failed to convert base64 to ArrayBuffer: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Convert File to base64 data URL
 * Uses the efficient ArrayBuffer conversion
 */
export function fileToBase64DataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target?.result;
      if (fileData) {
        try {
          const base64 = arrayBufferToBase64(fileData as ArrayBuffer);
          const dataUrl = `data:${file.type};base64,${base64}`;
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
