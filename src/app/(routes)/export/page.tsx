"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  ArrowLeft,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { generateVerificationURL } from "@/lib/qr/qrGenerator";
import {
  saveCertificate,
  CertificateData,
} from "@/lib/storage/certificateStorage";
import {
  generateCertificateCanvas,
  generateQRCodeForCertificate,
} from "@/lib/certificate/certificateRenderer";
import { base64ToArrayBuffer } from "@/lib/utils/fileUtils";
import { getExportScaling } from "@/lib/utils/scalingUtils";
import jsPDF from "jspdf";

interface TemplateField {
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
}

interface RecipientData {
  id: string;
  name: string;
  date: string;
  signature: string;
  [key: string]: string;
}

interface GeneratedCertificate {
  id: string;
  recipientId: string;
  recipientName: string;
  certificateId: string;
  qrCode: string;
  status: "pending" | "generating" | "completed" | "error";
  error?: string;
  fileUrl?: string;
}

export default function ExportPage() {
  const [template, setTemplate] = useState<{
    file: {
      name: string;
      size: number;
      type: string;
      lastModified: number;
      data: string;
    };
    fields: TemplateField[];
    createdAt: number;
  } | null>(null);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [recipients, setRecipients] = useState<RecipientData[]>([]);
  const [generatedCertificates, setGeneratedCertificates] = useState<
    GeneratedCertificate[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<"png" | "pdf">("pdf");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load data from sessionStorage
    const templateData = sessionStorage.getItem("template");
    const recipientsData = sessionStorage.getItem("recipients");

    if (templateData && recipientsData) {
      const parsedTemplate = JSON.parse(templateData);
      const parsedRecipients = JSON.parse(recipientsData);

      setTemplate(parsedTemplate);
      setFields(parsedTemplate.fields || []);
      setRecipients(parsedRecipients);

      // Initialize generated certificates
      const initialCertificates = parsedRecipients.map(
        (recipient: RecipientData) => ({
          id: `cert_${recipient.id}`,
          recipientId: recipient.id,
          recipientName: recipient.name || recipient.id || "Unknown",
          certificateId: generateCertificateId(),
          qrCode: "",
          status: "pending" as const,
        })
      );
      setGeneratedCertificates(initialCertificates);

      setIsLoading(false);
    } else {
      router.push("/upload");
    }
  }, [router]);

  const generateCertificateId = () => {
    return `CERT-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
  };

  const generateCertificate = async (
    recipient: RecipientData,
    certificate: GeneratedCertificate
  ) => {
    try {
      // Update status to generating
      setGeneratedCertificates((prev) =>
        prev.map((cert) =>
          cert.id === certificate.id ? { ...cert, status: "generating" } : cert
        )
      );

      // Generate QR code for this specific certificate
      const qrCode = await generateQRCodeForCertificate(
        certificate.certificateId,
        200,
        200
      );

      // Simulate certificate generation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create template image from PDF
      let templateImage: HTMLImageElement;
      let scalingInfo: {
        scale: number;
        originalWidth: number;
        originalHeight: number;
      } = {
        scale: 1,
        originalWidth: 800,
        originalHeight: 600,
      };

      if (template?.file?.data) {
        try {
          // Convert base64 data URL to ArrayBuffer using the efficient utility
          const base64Data = template.file.data.split(",")[1];
          const arrayBuffer = base64ToArrayBuffer(base64Data);

          // Render PDF to canvas using the same scaling logic as CanvasEditor
          const { renderPDFToCanvas } = await import("@/lib/pdf/pdfRenderer");

          // Use the same scaling logic as the canvas editor
          // The canvas editor uses default scaling (max 800x600, capped at 2x)
          const { canvas, pageInfo } = await renderPDFToCanvas(
            arrayBuffer,
            1
            // No target dimensions - use default scaling logic
          );

          // Convert canvas to image
          templateImage = new Image();
          await new Promise<void>((resolve, reject) => {
            templateImage.onload = () => resolve();
            templateImage.onerror = reject;
            templateImage.src = canvas.toDataURL();
          });

          // Calculate scaling info to match canvas editor logic
          // Use the same scaling calculation as the design page
          scalingInfo = getExportScaling(
            pageInfo.width,
            pageInfo.height,
            templateImage.width,
            templateImage.height
          );
        } catch (error) {
          console.error("Error rendering PDF template:", error);
          // Fallback to placeholder template
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = 800;
            canvas.height = 600;
            ctx.fillStyle = "#f8f9fa";
            ctx.fillRect(0, 0, 800, 600);
            ctx.strokeStyle = "#dee2e6";
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, 780, 580);
            ctx.fillStyle = "#212529";
            ctx.font = "bold 32px Arial";
            ctx.textAlign = "center";
            ctx.fillText("CERTIFICATE OF COMPLETION", 400, 100);
          }
          templateImage = canvas as unknown as HTMLImageElement;
        }
      } else {
        // Fallback to placeholder template
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = 800;
          canvas.height = 600;
          ctx.fillStyle = "#f8f9fa";
          ctx.fillRect(0, 0, 800, 600);
          ctx.strokeStyle = "#dee2e6";
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, 780, 580);
          ctx.fillStyle = "#212529";
          ctx.font = "bold 32px Arial";
          ctx.textAlign = "center";
          ctx.fillText("CERTIFICATE OF COMPLETION", 400, 100);
        }
        templateImage = canvas as unknown as HTMLImageElement;
      }

      // Load signature images from session storage
      const signatureImagesData = sessionStorage.getItem("signatureImages");
      const signatureImages = signatureImagesData
        ? JSON.parse(signatureImagesData)
        : [];

      // Generate certificate using template fields with scaled dimensions
      const certificateCanvas = await generateCertificateCanvas({
        templateImage,
        fields: fields,
        recipient,
        certificateId: certificate.certificateId,
        qrCode,
        signatureImages,
        width: templateImage.width,
        height: templateImage.height,
        scale: scalingInfo.scale,
        originalWidth: scalingInfo.originalWidth,
        originalHeight: scalingInfo.originalHeight,
      });

      // Convert to blob based on export format
      let blob: Blob;
      let fileUrl: string;

      if (exportFormat === "pdf") {
        // Generate PDF
        const pdf = new jsPDF({
          orientation:
            templateImage.width > templateImage.height
              ? "landscape"
              : "portrait",
          unit: "mm",
          format: [
            templateImage.width * 0.264583,
            templateImage.height * 0.264583,
          ], // Convert pixels to mm
        });

        // Add the certificate image to PDF
        const imgData = certificateCanvas.toDataURL("image/png");
        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          templateImage.width * 0.264583,
          templateImage.height * 0.264583
        );

        // Convert PDF to blob
        const pdfBlob = pdf.output("blob");
        blob = pdfBlob;
        fileUrl = URL.createObjectURL(pdfBlob);
      } else {
        // Generate PNG/JPEG
        blob = await new Promise<Blob>((resolve) => {
          certificateCanvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, "image/png");
        });
        fileUrl = URL.createObjectURL(blob);
      }

      // Save certificate to IndexedDB
      const certificateData: CertificateData = {
        id: certificate.certificateId, // Use certificateId as primary key for easier lookup
        certificateId: certificate.certificateId,
        recipientName: recipient.name || recipient.id || "Unknown",
        recipientData: recipient,
        templateId: `template_${Date.now()}`,
        createdAt: Date.now(),
        qrCode,
        verificationUrl: generateVerificationURL(certificate.certificateId),
      };

      try {
        await saveCertificate(certificateData);
      } catch (error) {
        console.error("Error saving certificate to IndexedDB:", error);
      }

      // Update certificate with generated data
      setGeneratedCertificates((prev) =>
        prev.map((cert) =>
          cert.id === certificate.id
            ? {
                ...cert,
                status: "completed",
                qrCode,
                fileUrl,
              }
            : cert
        )
      );
    } catch (error) {
      setGeneratedCertificates((prev) =>
        prev.map((cert) =>
          cert.id === certificate.id
            ? {
                ...cert,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : cert
        )
      );
    }
  };

  const generateAllCertificates = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const total = recipients.length;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const certificate = generatedCertificates.find(
        (cert) => cert.recipientId === recipient.id
      );

      if (certificate) {
        await generateCertificate(recipient, certificate);
      }

      setGenerationProgress(((i + 1) / total) * 100);
    }

    setIsGenerating(false);
  };

  const downloadCertificate = (certificate: GeneratedCertificate) => {
    if (certificate.fileUrl) {
      const link = document.createElement("a");
      link.href = certificate.fileUrl;
      const safeName =
        certificate.recipientName || certificate.recipientId || "certificate";
      link.download = `${safeName.replace(
        /\s+/g,
        "_"
      )}_certificate.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadAllCertificates = async () => {
    // In production, you'd create a ZIP file with all certificates
    const completedCertificates = generatedCertificates.filter(
      (cert) => cert.status === "completed"
    );

    for (const certificate of completedCertificates) {
      if (certificate.fileUrl) {
        downloadCertificate(certificate);
        // Add delay to prevent browser blocking
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading export data...
          </p>
        </div>
      </div>
    );
  }

  const completedCount = generatedCertificates.filter(
    (cert) => cert.status === "completed"
  ).length;
  const errorCount = generatedCertificates.filter(
    (cert) => cert.status === "error"
  ).length;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Enhanced Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation */}
            <div className="flex items-center space-x-2">
              <Link href="/data">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Data
                </Button>
              </Link>
            </div>

            {/* Center - Title */}
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export Certificates
              </h1>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link href="/verify">
                <Button variant="outline" size="sm">
                  Verify Certificate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 py-6">
          {/* Stats */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                {recipients.length} recipient
                {recipients.length !== 1 ? "s" : ""}
              </Badge>
              <Badge
                variant={
                  completedCount === recipients.length ? "default" : "secondary"
                }
                className="text-sm"
              >
                {completedCount}/{recipients.length} completed
              </Badge>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Generate and download your certificates
              </p>
            </div>
          </div>

          {/* Export Options */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Export Settings</CardTitle>
              <CardDescription>
                Choose your export format and generate certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Export Format
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) =>
                        setExportFormat(e.target.value as "png" | "pdf")
                      }
                      className="mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="png">PNG (Image)</option>
                      <option value="pdf">PDF (Document)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={generateAllCertificates}
                    disabled={
                      isGenerating || completedCount === recipients.length
                    }
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate All
                      </>
                    )}
                  </Button>
                  {completedCount > 0 && (
                    <Button
                      onClick={downloadAllCertificates}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  )}
                </div>
              </div>

              {isGenerating && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Generating certificates...</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certificates List */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Generated Certificates</CardTitle>
              <CardDescription>
                View and download individual certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {generatedCertificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {certificate.recipientName ||
                          certificate.recipientId ||
                          "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Certificate ID: {certificate.certificateId}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          certificate.status === "completed"
                            ? "default"
                            : certificate.status === "error"
                            ? "destructive"
                            : certificate.status === "generating"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {certificate.status === "completed" && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {certificate.status === "error" && (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {certificate.status === "generating" && (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        {certificate.status.charAt(0).toUpperCase() +
                          certificate.status.slice(1)}
                      </Badge>

                      {certificate.status === "completed" && (
                        <Button
                          size="sm"
                          onClick={() => downloadCertificate(certificate)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}

                      {certificate.status === "error" && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {certificate.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {completedCount > 0 && (
            <Alert className="mt-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully generated {completedCount} certificate
                {completedCount !== 1 ? "s" : ""}.
                {errorCount > 0 && ` ${errorCount} failed to generate.`}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
