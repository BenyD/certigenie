import { generateQRCode, generateVerificationURL } from "@/lib/qr/qrGenerator";
import { scaleCoordinates } from "@/lib/utils/scalingUtils";

export interface TemplateField {
  id: string;
  type: "text" | "date" | "signature" | "qr" | "certificateId";
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  placeholder?: string;
  label?: string;
  signatureImageId?: string;
}

export interface SignatureImage {
  id: string;
  name: string;
  dataUrl: string;
  file: File;
}

export interface RecipientData {
  id: string;
  name: string;
  date: string;
  signature: string;
  [key: string]: string;
}

export interface CertificateGenerationOptions {
  templateImage: HTMLImageElement;
  fields: TemplateField[];
  recipient: RecipientData;
  certificateId: string;
  qrCode: string;
  signatureImages?: SignatureImage[];
  width?: number;
  height?: number;
  scale?: number; // Scale factor to apply to field coordinates
  originalWidth?: number; // Original PDF width for scaling calculations
  originalHeight?: number; // Original PDF height for scaling calculations
}

export async function generateCertificateCanvas(
  options: CertificateGenerationOptions
): Promise<HTMLCanvasElement> {
  const {
    templateImage,
    fields,
    recipient,
    certificateId,
    qrCode,
    signatureImages = [],
    width = 800,
    height = 600,
    scale = 1,
    originalWidth,
    originalHeight,
  } = options;

  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = width;
  canvas.height = height;

  // Draw template background
  ctx.drawImage(templateImage, 0, 0, width, height);

  // Process each field with scaled coordinates
  for (const field of fields) {
    // Scale field coordinates to match the scaled template image
    // Always apply scaling if scale and original dimensions are provided
    const scaledField = {
      ...field,
      ...(scale && originalWidth && originalHeight
        ? scaleCoordinates(field.x, field.y, field.width, field.height, scale)
        : { x: field.x, y: field.y, width: field.width, height: field.height }),
    };

    await renderField(
      ctx,
      scaledField,
      recipient,
      certificateId,
      qrCode,
      signatureImages
    );
  }

  return canvas;
}

async function renderField(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  recipient: RecipientData,
  certificateId: string,
  qrCode: string,
  signatureImages: SignatureImage[]
): Promise<void> {
  const {
    type,
    x,
    y,
    width,
    height,
    fontSize = 16,
    fontFamily = "Arial",
    color = "#000000",
  } = field;

  ctx.save();

  // Get the field value from recipient data using field ID
  const fieldValue = recipient[field.id] || "";

  switch (type) {
    case "text":
    case "date":
      // Render text-based fields
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Handle text wrapping for long text
      const words = fieldValue.split(" ");
      let line = "";
      let yPos = y;
      const lineHeight = fontSize * 1.2;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > width && line !== "") {
          ctx.fillText(line, x, yPos);
          line = words[i] + " ";
          yPos += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, yPos);
      break;

    case "signature":
      // Render signature image if available
      if (field.signatureImageId) {
        const signatureImage = signatureImages.find(
          (sig) => sig.id === field.signatureImageId
        );
        if (signatureImage) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              // Calculate aspect ratio to fit within field bounds
              const aspectRatio = img.width / img.height;
              let drawWidth = width;
              let drawHeight = width / aspectRatio;

              if (drawHeight > height) {
                drawHeight = height;
                drawWidth = height * aspectRatio;
              }

              // Center the image within the field
              const centerX = x + (width - drawWidth) / 2;
              const centerY = y + (height - drawHeight) / 2;

              ctx.drawImage(img, centerX, centerY, drawWidth, drawHeight);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = signatureImage.dataUrl;
          });
        } else {
          // Fallback to text if image not found
          ctx.fillStyle = color;
          ctx.font = `${fontSize}px ${fontFamily}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText("Signature", x, y);
        }
      } else {
        // No signature image selected, render placeholder text
        ctx.fillStyle = color;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("Signature", x, y);
      }
      break;

    case "certificateId":
      // Render certificate ID
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(certificateId, x, y);
      break;

    case "qr":
      // Render QR code
      if (qrCode) {
        await new Promise<void>((resolve) => {
          const qrImg = new Image();
          qrImg.onload = () => {
            ctx.drawImage(qrImg, x, y, width, height);
            resolve();
          };
          qrImg.onerror = () => {
            // Fallback to placeholder
            ctx.fillStyle = "#e9ecef";
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = "#6c757d";
            ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = "#6c757d";
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("QR Code", x + width / 2, y + height / 2);
            resolve();
          };
          qrImg.src = qrCode;
        });
      } else {
        // QR Code placeholder
        ctx.fillStyle = "#e9ecef";
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = "#6c757d";
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = "#6c757d";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("QR Code", x + width / 2, y + height / 2);
      }
      break;
  }

  ctx.restore();
}

export async function generateQRCodeForCertificate(
  certificateId: string,
  width: number,
  height: number
): Promise<string> {
  const verificationUrl = generateVerificationURL(certificateId);
  return await generateQRCode(verificationUrl, {
    width,
    height,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    margin: 1,
    errorCorrectionLevel: "M",
  });
}
