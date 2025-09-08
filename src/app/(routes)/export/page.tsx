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
import {
  FileText,
  ArrowLeft,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Eye,
  Zap,
  BarChart3,
  Clock,
  Users,
  FileImage,
  FileDown,
  Sparkles,
  Square,
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
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>(
    []
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showSettings, setShowSettings] = useState(false);
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

  // Helper functions for enhanced UI
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "generating":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "generating":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const toggleCertificateSelection = (certificateId: string) => {
    setSelectedCertificates((prev) =>
      prev.includes(certificateId)
        ? prev.filter((id) => id !== certificateId)
        : [...prev, certificateId]
    );
  };

  const selectAllCertificates = () => {
    const allIds = generatedCertificates.map((cert) => cert.id);
    setSelectedCertificates(allIds);
  };

  const clearSelection = () => {
    setSelectedCertificates([]);
  };

  const downloadSelectedCertificates = async () => {
    const selectedCerts = generatedCertificates.filter(
      (cert) =>
        selectedCertificates.includes(cert.id) && cert.status === "completed"
    );

    for (const certificate of selectedCerts) {
      if (certificate.fileUrl) {
        downloadCertificate(certificate);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
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

      if (template?.file?.data) {
        try {
          // Convert base64 data URL to ArrayBuffer using the efficient utility
          const base64Data = template.file.data.split(",")[1];
          const arrayBuffer = base64ToArrayBuffer(base64Data);

          // Render PDF to canvas using the same scaling logic as CanvasEditor
          const { renderPDFToCanvas } = await import("@/lib/pdf/pdfRenderer");

          // Use the same scaling logic as the canvas editor
          // The canvas editor uses default scaling (max 800x600, capped at 2x)
          const { canvas } = await renderPDFToCanvas(
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

          // Note: No additional scaling needed since fields are already in original PDF coordinates
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

      // Generate certificate using template fields
      // Fields are already in original PDF coordinates, so no additional scaling needed
      const certificateCanvas = await generateCertificateCanvas({
        templateImage,
        fields: fields,
        recipient,
        certificateId: certificate.certificateId,
        qrCode,
        signatureImages,
        width: templateImage.width,
        height: templateImage.height,
        // Don't apply additional scaling since fields are already in original coordinates
        scale: 1,
        originalWidth: templateImage.width,
        originalHeight: templateImage.height,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation & Title */}
            <div className="flex items-center space-x-4">
              <Link href="/data">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Data
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Export Certificates
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate and download your certificates
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Link href="/verify">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 transition-all duration-200"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total Recipients
                    </p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {recipients.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Completed
                    </p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {completedCount}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      In Progress
                    </p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                      {
                        generatedCertificates.filter(
                          (cert) => cert.status === "generating"
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-xl">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Errors
                    </p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                      {errorCount}
                    </p>
                  </div>
                  <div className="p-3 bg-red-500 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Export Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Export Control Panel</span>
                </CardTitle>
                <CardDescription>
                  Configure and manage your certificate generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">
                    Export Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExportFormat("pdf")}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        exportFormat === "pdf"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">
                            PDF
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Document format
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setExportFormat("png")}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        exportFormat === "png"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FileImage className="h-6 w-6 text-green-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">
                            PNG
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Image format
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Generation Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Generation Controls
                    </h3>
                    {selectedCertificates.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      >
                        {selectedCertificates.length} selected
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={generateAllCertificates}
                      disabled={
                        isGenerating || completedCount === recipients.length
                      }
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate All
                        </>
                      )}
                    </Button>

                    {completedCount > 0 && (
                      <Button
                        onClick={downloadAllCertificates}
                        variant="outline"
                        className="hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20 transition-all duration-200"
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                    )}

                    {selectedCertificates.length > 0 && (
                      <Button
                        onClick={downloadSelectedCertificates}
                        variant="outline"
                        className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Selected
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {isGenerating && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Generating certificates...
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Math.round(generationProgress)}%
                      </span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  onClick={selectAllCertificates}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Select All
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  onClick={clearSelection}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        View Mode
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          variant={viewMode === "grid" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                        >
                          Grid
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                        >
                          List
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Certificates Gallery */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <span>Generated Certificates</span>
                  </CardTitle>
                  <CardDescription>
                    Manage and download your generated certificates
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-sm">
                    {generatedCertificates.length} total
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedCertificates.map((certificate) => (
                    <div
                      key={certificate.id}
                      className={`group relative p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${
                        selectedCertificates.includes(certificate.id)
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-3 left-3">
                        <input
                          type="checkbox"
                          checked={selectedCertificates.includes(
                            certificate.id
                          )}
                          onChange={() =>
                            toggleCertificateSelection(certificate.id)
                          }
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className={getStatusColor(certificate.status)}>
                          {getStatusIcon(certificate.status)}
                          <span className="ml-1 capitalize">
                            {certificate.status}
                          </span>
                        </Badge>
                      </div>

                      {/* Certificate Preview */}
                      <div className="mt-8 mb-4">
                        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {exportFormat.toUpperCase()} Preview
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {certificate.recipientName ||
                            certificate.recipientId ||
                            "Unknown"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {certificate.certificateId}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center justify-between">
                        {certificate.status === "completed" && (
                          <Button
                            size="sm"
                            onClick={() => downloadCertificate(certificate)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}

                        {certificate.status === "error" && (
                          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                            {certificate.error}
                          </div>
                        )}

                        {certificate.status === "generating" && (
                          <div className="flex items-center text-blue-600 dark:text-blue-400">
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            <span className="text-sm">Generating...</span>
                          </div>
                        )}

                        {certificate.status === "pending" && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Waiting...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {generatedCertificates.map((certificate) => (
                    <div
                      key={certificate.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md ${
                        selectedCertificates.includes(certificate.id)
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedCertificates.includes(
                            certificate.id
                          )}
                          onChange={() =>
                            toggleCertificateSelection(certificate.id)
                          }
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />

                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-gray-400" />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {certificate.recipientName ||
                              certificate.recipientId ||
                              "Unknown"}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {certificate.certificateId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(certificate.status)}>
                          {getStatusIcon(certificate.status)}
                          <span className="ml-1 capitalize">
                            {certificate.status}
                          </span>
                        </Badge>

                        {certificate.status === "completed" && (
                          <Button
                            size="sm"
                            onClick={() => downloadCertificate(certificate)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}

                        {certificate.status === "error" && (
                          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                            {certificate.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary & Next Steps */}
          {completedCount > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-500 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      🎉 Export Complete!
                    </h3>
                    <p className="text-green-700 dark:text-green-300 mb-4">
                      Successfully generated <strong>{completedCount}</strong>{" "}
                      certificate{completedCount !== 1 ? "s" : ""}.
                      {errorCount > 0 && ` ${errorCount} failed to generate.`}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={downloadAllCertificates}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                      <Link href="/verify">
                        <Button
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/20"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Verify Certificates
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
                <FileText className="h-4 w-4" />
                <span className="text-sm">CertiGenie Export System</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Powered by advanced certificate generation technology
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
