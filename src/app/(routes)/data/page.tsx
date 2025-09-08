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
  Upload,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  Users,
  Database,
  FileSpreadsheet,
  CheckCircle,
  Edit3,
  Save,
  X,
  BarChart3,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { z } from "zod";

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
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [editingRecipient, setEditingRecipient] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<RecipientData>({ id: "" });
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

    const headers = template.fields
      .filter((field) => field.type === "text" || field.type === "date")
      .map((field) => getFieldDisplayName(field));

    const csvContent = [
      headers.join(","),
      headers.map(() => "Sample Data").join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_recipients.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const lines = csvText.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());
      const data = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });
          return row;
        });

      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
  });

  const addRecipient = () => {
    if (!template) return;

    const newRecipient: RecipientData = {
      id: `recipient-${Date.now()}`,
    };

    // Pre-fill with current form data
    template.fields.forEach((field) => {
      if (field.type === "text" || field.type === "date") {
        newRecipient[field.id] = currentRecipient[field.id] || "";
      }
    });

    setRecipients([...recipients, newRecipient]);
    setCurrentRecipient({ id: "" });
    clearValidationErrors();
  };

  const deleteRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((recipient) => recipient.id !== id));
  };

  const startEditing = (recipient: RecipientData) => {
    setEditingRecipient(recipient.id);
    setEditingData({ ...recipient });
  };

  const saveEditing = () => {
    if (!editingRecipient) return;

    const validation = validateRecipient(editingData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setRecipients((prev) =>
      prev.map((recipient) =>
        recipient.id === editingRecipient ? editingData : recipient
      )
    );
    setEditingRecipient(null);
    setEditingData({ id: "" });
    clearValidationErrors();
  };

  const cancelEditing = () => {
    setEditingRecipient(null);
    setEditingData({ id: "" });
    clearValidationErrors();
  };

  const importFromCSV = () => {
    if (csvData.length === 0) return;

    const newRecipients: RecipientData[] = csvData.map((row, index) => ({
      id: `recipient-${Date.now()}-${index}`,
      ...row,
    }));

    setRecipients([...recipients, ...newRecipients]);
    setCsvData([]);
  };

  const saveData = () => {
    sessionStorage.setItem("recipients", JSON.stringify(recipients));
    router.push("/export");
  };

  useEffect(() => {
    const templateData = sessionStorage.getItem("template");
    const recipientsData = sessionStorage.getItem("recipients");

    if (templateData) {
      setTemplate(JSON.parse(templateData));
    }

    if (recipientsData) {
      setRecipients(JSON.parse(recipientsData));
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Template Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please go back to the design page to create a template first.
            </p>
            <Link href="/design">
              <Button className="w-full">Go to Design Page</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const textFields = template.fields.filter(
    (field) => field.type === "text" || field.type === "date"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation & Title */}
            <div className="flex items-center space-x-4">
              <Link href="/design">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Design
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Recipient Data
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage certificate recipient information
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={saveData}
                disabled={recipients.length === 0}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Zap className="h-4 w-4 mr-2" />
                Continue to Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                      Data Fields
                    </p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {textFields.length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-xl">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Template Fields
                    </p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {template.fields.length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Ready to Export
                    </p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                      {recipients.length > 0 ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="manual" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
              <TabsTrigger
                value="manual"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Manual Entry</span>
              </TabsTrigger>
              <TabsTrigger
                value="import"
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>CSV Import</span>
              </TabsTrigger>
            </TabsList>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Edit3 className="h-5 w-5 text-blue-600" />
                    <span>Add New Recipient</span>
                  </CardTitle>
                  <CardDescription>
                    Enter recipient information for certificate generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {textFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label
                          htmlFor={field.id}
                          className="text-sm font-medium"
                        >
                          {getFieldDisplayName(field)}
                          {field.type === "text" && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <Input
                          id={field.id}
                          type={getFieldInputType(field)}
                          value={currentRecipient[field.id] || ""}
                          onChange={(e) =>
                            setCurrentRecipient({
                              ...currentRecipient,
                              [field.id]: e.target.value,
                            })
                          }
                          placeholder={
                            field.placeholder ||
                            `Enter ${getFieldDisplayName(field).toLowerCase()}`
                          }
                          className={
                            validationErrors[field.id] ? "border-red-500" : ""
                          }
                        />
                        {validationErrors[field.id] && (
                          <p className="text-sm text-red-500">
                            {validationErrors[field.id]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={addRecipient}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Recipient
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CSV Import Tab */}
            <TabsContent value="import" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span>Import from CSV</span>
                  </CardTitle>
                  <CardDescription>
                    Upload a CSV file to import multiple recipients at once
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {isDragActive
                        ? "Drop your CSV file here"
                        : "Drag & drop a CSV file here"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      or click to browse files
                    </p>
                  </div>

                  {csvData.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          CSV Data Preview ({csvData.length} rows)
                        </h3>
                        <Button
                          onClick={importFromCSV}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import All
                        </Button>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                              <tr>
                                {Object.keys(csvData[0] || {}).map((header) => (
                                  <th
                                    key={header}
                                    className="px-4 py-2 text-left font-medium text-gray-900 dark:text-white"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {csvData.slice(0, 5).map((row, index) => (
                                <tr key={index}>
                                  {Object.values(row).map(
                                    (value, cellIndex) => (
                                      <td
                                        key={cellIndex}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-400"
                                      >
                                        {value}
                                      </td>
                                    )
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={downloadSampleCSV}
                      variant="outline"
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recipients List */}
          {recipients.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span>Recipients ({recipients.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your recipient data
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recipients.map((recipient, index) => (
                    <div
                      key={recipient.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200"
                    >
                      {editingRecipient === recipient.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {textFields.map((field) => (
                              <div key={field.id} className="space-y-2">
                                <Label
                                  htmlFor={`edit-${field.id}`}
                                  className="text-sm font-medium"
                                >
                                  {getFieldDisplayName(field)}
                                </Label>
                                <Input
                                  id={`edit-${field.id}`}
                                  type={getFieldInputType(field)}
                                  value={editingData[field.id] || ""}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                  className={
                                    validationErrors[field.id]
                                      ? "border-red-500"
                                      : ""
                                  }
                                />
                                {validationErrors[field.id] && (
                                  <p className="text-sm text-red-500">
                                    {validationErrors[field.id]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              onClick={saveEditing}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={cancelEditing}
                              size="sm"
                              variant="outline"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                Recipient {index + 1}
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              {textFields.map((field) => (
                                <div key={field.id}>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {getFieldDisplayName(field)}:
                                  </span>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {recipient[field.id] || "—"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => startEditing(recipient)}
                              size="sm"
                              variant="outline"
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => deleteRecipient(recipient.id)}
                              size="sm"
                              variant="outline"
                              className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-6">
            <Link href="/design">
              <Button
                variant="outline"
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Design
              </Button>
            </Link>
            <Button
              onClick={saveData}
              disabled={recipients.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Zap className="h-4 w-4 mr-2" />
              Continue to Export ({recipients.length} recipients)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
