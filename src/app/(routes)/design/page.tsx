"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SidePanel from "@/components/design/SidePanel";
import Toolbar from "@/components/design/Toolbar";

// Dynamically import the canvas editor to avoid SSR issues
const CanvasEditor = dynamic(() => import("@/components/canvas/CanvasEditor"), {
  ssr: false,
});

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
  signatureImageId?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: "left" | "center" | "right";
}

interface SignatureImage {
  id: string;
  name: string;
  dataUrl: string;
  file: File;
}

export default function DesignPage() {
  const [templateFile, setTemplateFile] = useState<{
    name: string;
    size: number;
    type: string;
    lastModified: number;
    data: string;
  } | null>(null);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedField, setSelectedField] = useState<TemplateField | null>(
    null
  );
  const [signatureImages, setSignatureImages] = useState<SignatureImage[]>([]);
  const [autoSaveEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFieldType, setDraggedFieldType] = useState<
    TemplateField["type"] | null
  >(null);
  const [zoom, setZoom] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load template file from sessionStorage
    const fileInfo = sessionStorage.getItem("templateFile");
    const fileData = sessionStorage.getItem("templateFileData");

    if (fileInfo && fileData) {
      setTemplateFile({
        ...JSON.parse(fileInfo),
        data: fileData,
      });
      // Don't set loading to false here - let CanvasEditor handle its own loading
    } else {
      // Redirect to upload if no file
      router.push("/upload");
    }
  }, [router]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const autoSaveInterval = setInterval(() => {
      if (fields.length > 0 || signatureImages.length > 0) {
        const template = {
          file: templateFile,
          fields,
          createdAt: Date.now(),
        };
        sessionStorage.setItem("template", JSON.stringify(template));
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [fields, signatureImages, autoSaveEnabled, templateFile]);

  const getPlaceholderText = (type: TemplateField["type"]) => {
    switch (type) {
      case "text":
        return "Text Field";
      case "date":
        return "Date Field";
      case "signature":
        return "Signature Field";
      case "qr":
        return "QR Code";
      case "certificateId":
        return "Certificate ID";
      default:
        return "Field";
    }
  };

  const getDefaultFieldLabel = (type: TemplateField["type"]) => {
    switch (type) {
      case "text":
        return "Text Field";
      case "date":
        return "Date Field";
      case "signature":
        return "Signature";
      case "qr":
        return "QR Code";
      case "certificateId":
        return "Certificate ID";
      default:
        return "Field";
    }
  };

  const addField = (type: TemplateField["type"]) => {
    // Proportional field sizes based on type
    const getFieldDimensions = (type: TemplateField["type"]) => {
      switch (type) {
        case "text":
          return { width: 120, height: 28 };
        case "date":
          return { width: 100, height: 28 };
        case "signature":
          return { width: 140, height: 50 };
        case "qr":
          return { width: 60, height: 60 };
        case "certificateId":
          return { width: 110, height: 28 };
        default:
          return { width: 120, height: 28 };
      }
    };

    const dimensions = getFieldDimensions(type);

    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: dimensions.width,
      height: dimensions.height,
      fontSize: 12, // Reduced from 16
      fontFamily: "Arial",
      color: "#000000",
      placeholder: getPlaceholderText(type),
      label: getDefaultFieldLabel(type),
      bold: false,
      italic: false,
      underline: false,
      textAlign: "left",
    };
    const newFields = [...fields, newField];
    setFields(newFields);
    setSelectedField(newField);
  };

  const updateField = (fieldId: string, updates: Partial<TemplateField>) => {
    const newFields = fields.map((field) => {
      if (field.id === fieldId) {
        const updatedField = { ...field, ...updates };

        // Validate field properties
        if (updatedField.fontSize && updatedField.fontSize < 8) {
          updatedField.fontSize = 8; // Minimum font size
        }
        if (updatedField.fontSize && updatedField.fontSize > 72) {
          updatedField.fontSize = 72; // Maximum font size
        }
        if (updatedField.width && updatedField.width < 20) {
          updatedField.width = 20; // Minimum width
        }
        if (updatedField.height && updatedField.height < 20) {
          updatedField.height = 20; // Minimum height
        }

        return updatedField;
      }
      return field;
    });

    setFields(newFields);
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const deleteField = useCallback(
    (fieldId: string) => {
      const newFields = fields.filter((field) => field.id !== fieldId);
      setFields(newFields);
      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }
    },
    [fields, selectedField]
  );

  // Zoom control functions
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 3)); // Max zoom 3x
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5)); // Min zoom 0.5x
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  const handleTogglePreview = useCallback(() => {
    setPreviewMode((prev) => !prev);
  }, []);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "=":
          case "+":
            event.preventDefault();
            handleZoomIn();
            break;
          case "-":
            event.preventDefault();
            handleZoomOut();
            break;
          case "0":
            event.preventDefault();
            handleZoomReset();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleZoomReset]);

  const handleSignatureUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (1MB limit)
    if (file.size > 1024 * 1024) {
      alert("File size must be less than 1MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const signatureImage: SignatureImage = {
        id: `sig_${Date.now()}`,
        name: file.name,
        dataUrl,
        file,
      };
      const newSignatureImages = [...signatureImages, signatureImage];
      setSignatureImages(newSignatureImages);
    };
    reader.readAsDataURL(file);
  };

  const deleteSignature = (signatureId: string) => {
    const newSignatureImages = signatureImages.filter(
      (sig) => sig.id !== signatureId
    );
    setSignatureImages(newSignatureImages);
    // Remove signature from any fields using it
    const newFields = fields.map((field) =>
      field.signatureImageId === signatureId
        ? { ...field, signatureImageId: undefined }
        : field
    );
    setFields(newFields);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault();
            const template = {
              file: templateFile,
              fields,
              createdAt: Date.now(),
            };
            sessionStorage.setItem("template", JSON.stringify(template));
            break;
        }
      }

      if (e.key === "Delete" && selectedField) {
        deleteField(selectedField.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedField, templateFile, fields, deleteField]);

  // Drag and drop handlers
  const handleDragStart = (fieldType: TemplateField["type"]) => {
    setIsDragging(true);
    setDraggedFieldType(fieldType);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedFieldType(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedFieldType) {
      addField(draggedFieldType);
    }
    handleDragEnd();
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const saveTemplate = () => {
    const template = {
      file: templateFile,
      fields,
      createdAt: Date.now(),
    };
    sessionStorage.setItem("template", JSON.stringify(template));
    // TODO: Save to IndexedDB
  };

  const handleContinue = () => {
    saveTemplate();
    router.push("/data");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Enhanced Toolbar */}
      <Toolbar
        onContinue={handleContinue}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        previewMode={previewMode}
        onTogglePreview={handleTogglePreview}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex lg:flex-row overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Content */}
          <div
            className={`flex-1 bg-gray-50 dark:bg-gray-900 relative transition-all duration-300 min-h-[800px] ${
              isDragging ? "bg-blue-50/80 dark:bg-blue-900/20" : ""
            }`}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
          >
            <CanvasEditor
              templateFile={templateFile}
              fields={fields}
              selectedField={selectedField}
              onFieldSelect={setSelectedField}
              onFieldUpdate={updateField}
              onFieldDelete={deleteField}
              signatureImages={signatureImages}
              zoom={zoom}
              previewMode={previewMode}
            />

            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 dark:bg-blue-900/30 rounded-xl pointer-events-none backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg animate-pulse">
                    <span className="text-white text-3xl font-bold">+</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    Drop to add {draggedFieldType} field
                  </p>
                  <p className="text-sm text-blue-500 dark:text-blue-300 mt-1">
                    Position it anywhere on the certificate
                  </p>
                  <div className="mt-4 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💡 Tip: You can drag and resize fields after placing them
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - SidePanel */}
        <div className="w-full lg:w-96 h-full border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl flex flex-col">
          <SidePanel
            fields={fields}
            selectedField={selectedField}
            signatureImages={signatureImages}
            onAddField={addField}
            onUpdateField={updateField}
            onDeleteField={deleteField}
            onSignatureUpload={handleSignatureUpload}
            onDeleteSignature={deleteSignature}
            onDragStart={handleDragStart}
            onSelectField={setSelectedField}
          />
        </div>
      </div>
    </div>
  );
}
