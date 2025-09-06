import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  height?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const defaultOptions = {
      width: 200,
      height: 200,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      margin: 2,
      errorCorrectionLevel: "M" as const,
      ...options,
    };

    const qrCodeDataURL = await QRCode.toDataURL(data, defaultOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

export async function generateQRCodeCanvas(
  data: string,
  options: QRCodeOptions = {}
): Promise<HTMLCanvasElement> {
  try {
    const defaultOptions = {
      width: 200,
      height: 200,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      margin: 2,
      errorCorrectionLevel: "M" as const,
      ...options,
    };

    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, data, defaultOptions);
    return canvas;
  } catch (error) {
    console.error("Error generating QR code canvas:", error);
    throw new Error("Failed to generate QR code canvas");
  }
}

export function generateVerificationURL(certificateId: string): string {
  // In a real app, this would be your domain
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://certigenie.app";
  return `${baseUrl}/verify?certificateId=${encodeURIComponent(certificateId)}`;
}
