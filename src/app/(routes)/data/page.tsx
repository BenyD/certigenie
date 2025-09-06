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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  Eye,
  Download,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { z } from "zod";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Rect,
  Group,
} from "react-konva";
// Live Preview Component using Konva (same as design page)
const LiveCertificatePreview = ({
  template,
  currentRecipient,
}: {
  template: {
    file: {
      name: string;
      size: number;
      type: string;
      lastModified: number;
      data: string;
    };
    fields: TemplateField[];
    createdAt: number;
  } | null;
  currentRecipient: RecipientData;
}) => {
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!template?.file) {
      setError("No template available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const img = new window.Image();
    img.onload = () => {
      setTemplateImage(img);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError("Failed to load template image");
      setIsLoading(false);
    };
    img.src = template.file.data;
  }, [template]);

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No template loaded</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading preview...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            Preview Error
          </p>
          <p className="text-xs text-red-500 dark:text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!templateImage) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Loading template...</p>
      </div>
    );
  }

  // Calculate scaling to fit the container (same logic as design page)
  const containerWidth = 800; // Fixed width for preview
  const containerHeight = 600; // Fixed height for preview
  const scaleX = containerWidth / templateImage.width;
  const scaleY = containerHeight / templateImage.height;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

  const stageWidth = templateImage.width * scale;
  const stageHeight = templateImage.height * scale;

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="relative">
        <Stage
          width={stageWidth}
          height={stageHeight}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer>
            {/* Template background */}
            <KonvaImage
              image={templateImage}
              width={templateImage.width}
              height={templateImage.height}
              listening={false}
            />

            {/* Render fields with actual recipient data */}
            {template.fields.map((field) => {
              const fieldKey = `${field.id}-${field.fontSize}-${field.fontFamily}-${field.color}-${field.placeholder}`;
              const displayX = field.x;
              const displayY = field.y;
              const displayWidth = field.width;
              const displayHeight = field.height;

              // Get actual value from recipient data
              const fieldValue =
                currentRecipient[field.id] || field.placeholder || "";

              switch (field.type) {
                case "text":
                case "date":
                  return (
                    <Group key={fieldKey} id={field.id}>
                      <Text
                        x={displayX}
                        y={displayY}
                        width={displayWidth}
                        height={displayHeight}
                        text={fieldValue}
                        fontSize={field.fontSize || 12}
                        fontFamily={field.fontFamily || "Arial"}
                        fill={field.color || "#1f2937"}
                        align={field.textAlign || "left"}
                        verticalAlign="top"
                        wrap="word"
                        listening={false}
                        fontStyle={`${field.bold ? "bold" : ""} ${
                          field.italic ? "italic" : ""
                        }`.trim()}
                      />
                    </Group>
                  );
                case "signature":
                  return (
                    <Group key={fieldKey} id={field.id}>
                      <Rect
                        x={displayX}
                        y={displayY}
                        width={displayWidth}
                        height={displayHeight}
                        fill="transparent"
                        stroke="#d1d5db"
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                      />
                      <Text
                        x={displayX + 5}
                        y={displayY + 5}
                        text={fieldValue || "Signature"}
                        fontSize={12}
                        fill="#6b7280"
                        listening={false}
                      />
                    </Group>
                  );
                case "qr":
                  return (
                    <Group key={fieldKey} id={field.id}>
                      <Rect
                        x={displayX}
                        y={displayY}
                        width={displayWidth}
                        height={displayHeight}
                        fill="transparent"
                        stroke="#d1d5db"
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                      />
                      <Text
                        x={displayX + 5}
                        y={displayY + 5}
                        text="QR Code"
                        fontSize={12}
                        fill="#6b7280"
                        listening={false}
                      />
                    </Group>
                  );
                case "certificateId":
                  return (
                    <Group key={fieldKey} id={field.id}>
                      <Text
                        x={displayX}
                        y={displayY}
                        width={displayWidth}
                        height={displayHeight}
                        text={fieldValue || "CERT-123456"}
                        fontSize={field.fontSize || 12}
                        fontFamily={field.fontFamily || "Arial"}
                        fill={field.color || "#1f2937"}
                        align={field.textAlign || "left"}
                        verticalAlign="top"
                        wrap="word"
                        listening={false}
                      />
                    </Group>
                  );
                default:
                  return null;
              }
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

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
  label?: string;
  name?: string;
  signatureImageId?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: "left" | "center" | "right";
}

interface RecipientData {
  id: string;
  [key: string]: string;
}

// Helper function
const getFieldDisplayName = (field: TemplateField) => {
  return (
    field.name ||
    field.label ||
    field.placeholder ||
    field.type.charAt(0).toUpperCase() + field.type.slice(1)
  );
};

// Validation schemas
const createRecipientSchema = (fields: TemplateField[]) => {
  const schemaFields: Record<string, z.ZodString> = {};

  fields.forEach((field) => {
    if (field.type === "text" || field.type === "date") {
      if (field.type === "text") {
        schemaFields[field.id] = z
          .string()
          .min(1, `${getFieldDisplayName(field)} is required`);
      } else if (field.type === "date") {
        schemaFields[field.id] = z
          .string()
          .min(1, `${getFieldDisplayName(field)} is required`);
      }
    }
  });

  return z.object(schemaFields);
};

export default function DataPage() {
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
  const [recipients, setRecipients] = useState<RecipientData[]>([]);
  const [currentRecipient, setCurrentRecipient] = useState<RecipientData>({
    id: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const router = useRouter();

  const getFieldInputType = (field: TemplateField) => {
    switch (field.type) {
      case "date":
        return "date";
      case "signature":
        return "text";
      case "text":
        return "text";
      case "certificateId":
        return "text";
      case "qr":
        return "text"; // QR codes are auto-generated, but we can allow custom text
      default:
        return "text";
    }
  };

  // Validation functions
  const validateRecipient = (recipient: RecipientData) => {
    if (!template) return { isValid: true, errors: {} };

    const schema = createRecipientSchema(template.fields);
    const result = schema.safeParse(recipient);

    if (result.success) {
      return { isValid: true, errors: {} };
    } else {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      return { isValid: false, errors };
    }
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  const downloadSampleCSV = () => {
    if (!template || template.fields.length === 0) {
      alert(
        "No fields designed yet. Please go back to the design page to add fields."
      );
      return;
    }

    // Generate CSV headers based on template fields (only text and date)
    const headers = template.fields
      .filter((field) => field.type === "text" || field.type === "date")
      .map((field) => getFieldDisplayName(field));

    // Generate sample data (3 rows)
    const sampleData = [
      headers.map((header) => `Sample ${header} 1`),
      headers.map((header) => `Sample ${header} 2`),
      headers.map((header) => `Sample ${header} 3`),
    ];

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) => row.join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_certificate_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Load template from sessionStorage
    const templateData = sessionStorage.getItem("template");
    if (templateData) {
      const parsedTemplate = JSON.parse(templateData);
      setTemplate(parsedTemplate);

      // Initialize current recipient with default values for each field
      const initialRecipient: RecipientData = { id: "" };
      parsedTemplate.fields.forEach((field: TemplateField) => {
        if (field.type === "date") {
          initialRecipient[field.id] = new Date().toISOString().split("T")[0];
        } else {
          initialRecipient[field.id] = "";
        }
      });
      setCurrentRecipient(initialRecipient);

      setIsLoading(false);
    } else {
      router.push("/upload");
    }
  }, [router]);

  const handleSingleRecipientChange = (field: string, value: string) => {
    setCurrentRecipient((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSingleRecipient = () => {
    // Clear previous validation errors
    clearValidationErrors();

    // Validate the current recipient
    const validation = validateRecipient(currentRecipient);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Check if at least one field has a value
    const hasValue = Object.entries(currentRecipient).some(
      ([key, value]) => key !== "id" && value && value.trim()
    );

    if (hasValue) {
      const newRecipient = {
        ...currentRecipient,
        id: `recipient_${Date.now()}`,
      };
      setRecipients((prev) => [...prev, newRecipient]);

      // Reset current recipient with default values
      const resetRecipient: RecipientData = { id: "" };
      template?.fields.forEach((field: TemplateField) => {
        if (field.type === "date") {
          resetRecipient[field.id] = new Date().toISOString().split("T")[0];
        } else {
          resetRecipient[field.id] = "";
        }
      });
      setCurrentRecipient(resetRecipient);
    }
  };

  const removeRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const onCsvDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      // Simple CSV parsing (in production, use PapaParse)
      const lines = csvText.split("\n");
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, ""));
      const data = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });
          return row;
        });

      setCsvData(data);

      // Auto-map common fields based on template fields
      const autoMapping: Record<string, string> = {};
      if (template) {
        headers.forEach((header) => {
          const lowerHeader = header.toLowerCase();
          // Try to match with template field placeholders or types
          template.fields.forEach((field) => {
            const fieldLabel = field.placeholder?.toLowerCase() || field.type;
            if (
              lowerHeader.includes(fieldLabel) ||
              (field.type === "text" &&
                (lowerHeader.includes("name") ||
                  lowerHeader.includes("recipient"))) ||
              (field.type === "date" && lowerHeader.includes("date")) ||
              (field.type === "signature" && lowerHeader.includes("signature"))
            ) {
              autoMapping[header] = field.id;
            }
          });
        });
      }
      setCsvMapping(autoMapping);
    };
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onCsvDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const applyCsvMapping = () => {
    const mappedRecipients = csvData.map((row, index) => {
      const recipient: RecipientData = {
        id: `csv_recipient_${index}`,
      };

      // Initialize with default values for all template fields
      if (template) {
        template.fields.forEach((field) => {
          if (field.type === "date") {
            recipient[field.id] = new Date().toISOString().split("T")[0];
          } else {
            recipient[field.id] = "";
          }
        });
      }

      // Map CSV data to fields
      Object.entries(csvMapping).forEach(([csvColumn, fieldId]) => {
        if (row[csvColumn]) {
          recipient[fieldId] = row[csvColumn];
        }
      });

      return recipient;
    });

    setRecipients((prev) => [...prev, ...mappedRecipients]);
    setCsvData([]);
    setCsvMapping({});
  };

  const handleContinue = () => {
    if (recipients.length === 0) {
      alert("Please add at least one recipient before continuing.");
      return;
    }

    // Store recipients data
    sessionStorage.setItem("recipients", JSON.stringify(recipients));
    router.push("/export");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading template...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Enhanced Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation */}
            <div className="flex items-center space-x-2">
              <Link href="/design">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Design
                </Button>
              </Link>
            </div>

            {/* Center - Title */}
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recipient Data
              </h1>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Button
                onClick={handleContinue}
                disabled={recipients.length === 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                Continue to Export
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
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
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enter recipient details for your certificates
              </p>
            </div>
          </div>

          <Tabs defaultValue="single" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="single">Single Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>

            {/* Single Entry Tab */}
            <TabsContent value="single" className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Form Section */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Add Single Recipient</CardTitle>
                    <CardDescription>
                      Enter details for one certificate recipient
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    {template && template.fields.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {template.fields
                          .filter(
                            (field) =>
                              field.type === "text" || field.type === "date"
                          )
                          .map((field) => (
                            <div
                              key={field.id}
                              className={`space-y-2 ${
                                field.type === "signature"
                                  ? "md:col-span-2"
                                  : ""
                              }`}
                            >
                              <Label
                                htmlFor={field.id}
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                {getFieldDisplayName(field)}
                                {field.type === "text" && " *"}
                              </Label>
                              <Input
                                id={field.id}
                                type={getFieldInputType(field)}
                                value={currentRecipient[field.id] || ""}
                                onChange={(e) => {
                                  handleSingleRecipientChange(
                                    field.id,
                                    e.target.value
                                  );
                                  // Clear validation error when user starts typing
                                  if (validationErrors[field.id]) {
                                    setValidationErrors((prev) => {
                                      const newErrors = { ...prev };
                                      delete newErrors[field.id];
                                      return newErrors;
                                    });
                                  }
                                }}
                                placeholder={
                                  field.placeholder || `Enter ${field.type}`
                                }
                                className={`w-full ${
                                  validationErrors[field.id]
                                    ? "border-red-500 focus:border-red-500"
                                    : ""
                                }`}
                              />
                              {validationErrors[field.id] && (
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                  {validationErrors[field.id]}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>
                          No fields designed yet. Please go back to the design
                          page to add fields.
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={addSingleRecipient}
                      disabled={
                        !Object.entries(currentRecipient).some(
                          ([key, value]) =>
                            key !== "id" && value && value.trim()
                        )
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Recipient
                    </Button>
                  </CardContent>
                </Card>

                {/* Live Preview Section */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>
                      See how your certificate will look with the current data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <LiveCertificatePreview
                      template={template}
                      currentRecipient={currentRecipient}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* CSV Upload Tab */}
            <TabsContent value="csv" className="flex-1 overflow-y-auto">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Upload CSV File</CardTitle>
                  <CardDescription>
                    Upload a CSV file with multiple recipients
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            {isDragActive
                              ? "Drop the CSV here"
                              : "Choose CSV file or drag it here"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            CSV files only, with headers
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <Button
                        onClick={downloadSampleCSV}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Sample CSV</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {csvData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Map CSV Columns</CardTitle>
                    <CardDescription>
                      Map your CSV columns to certificate fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(csvData[0] || {}).map((column) => (
                        <div key={column}>
                          <Label htmlFor={column}>{column}</Label>
                          <select
                            id={column}
                            value={csvMapping[column] || ""}
                            onChange={(e) =>
                              setCsvMapping((prev) => ({
                                ...prev,
                                [column]: e.target.value,
                              }))
                            }
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                          >
                            <option value="">Select field</option>
                            {template?.fields
                              .filter(
                                (field) =>
                                  field.type === "text" || field.type === "date"
                              )
                              .map((field) => (
                                <option key={field.id} value={field.id}>
                                  {getFieldDisplayName(field)}
                                </option>
                              ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {csvData.length} rows will be imported
                      </p>
                      <Button onClick={applyCsvMapping}>
                        Import Recipients
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Recipients List */}
          {recipients.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recipients ({recipients.length})</CardTitle>
                <CardDescription>
                  Review and manage your certificate recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {template?.fields.find((f) => f.type === "text")
                            ? recipient[
                                template.fields.find((f) => f.type === "text")!
                                  .id
                              ] || "Unnamed"
                            : "Recipient"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {template?.fields
                            .filter(
                              (field) =>
                                field.type === "text" || field.type === "date"
                            )
                            .map((field) => (
                              <span key={field.id}>
                                {getFieldDisplayName(field)}:{" "}
                                {recipient[field.id] || "Not provided"}
                              </span>
                            ))
                            .reduce(
                              (prev, curr, index) => [
                                ...prev,
                                index > 0 ? " | " : "",
                                curr,
                              ],
                              [] as (string | React.JSX.Element)[]
                            )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRecipient(recipient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
