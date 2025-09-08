"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as KonvaImage,
  Group,
  Transformer,
} from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { renderPDFToCanvas } from "@/lib/pdf/pdfRenderer";
import { generateQRCode, generateVerificationURL } from "@/lib/qr/qrGenerator";
import { calculateScaling } from "@/lib/utils/scalingUtils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3 } from "lucide-react";

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

interface CanvasEditorProps {
  templateFile: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    data: string;
  } | null;
  fields: TemplateField[];
  selectedField: TemplateField | null;
  signatureImages: SignatureImage[];
  onFieldSelect: (field: TemplateField | null) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<TemplateField>) => void;
  onFieldDelete: (fieldId: string) => void;
  zoom?: number;
  previewMode?: boolean;
}

export default function CanvasEditor({
  templateFile,
  fields,
  selectedField,
  signatureImages,
  onFieldSelect,
  onFieldUpdate,
  onFieldDelete,
  zoom = 1,
  previewMode = false,
}: CanvasEditorProps) {
  const stageRef = useRef<KonvaStage>(null);
  const transformerRef = useRef<KonvaTransformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfImage, setPdfImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [qrCodeImages, setQrCodeImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());
  const [loadedSignatureImages, setLoadedSignatureImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());
  const [contextMenuField, setContextMenuField] =
    useState<TemplateField | null>(null);
  const [isEditingFieldName, setIsEditingFieldName] = useState(false);
  const [editingFieldName, setEditingFieldName] = useState("");

  const loadPdfAsImage = useCallback(
    async (retryCount = 0) => {
      try {
        setIsLoading(true);
        setPdfError(null);

        if (!templateFile?.data) {
          throw new Error("No PDF data available");
        }

        // Convert data URL to ArrayBuffer
        let pdfData: ArrayBuffer;
        if (templateFile.data.startsWith("data:")) {
          // It's a data URL, extract the base64 part
          const base64 = templateFile.data.split(",")[1];
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          pdfData = bytes.buffer;
        } else {
          // It's already an ArrayBuffer
          pdfData = templateFile.data as unknown as ArrayBuffer;
        }

        // Render PDF to canvas
        const { canvas, pageInfo } = await renderPDFToCanvas(pdfData, 1);

        // Set the actual stage size (PDF dimensions)
        setStageSize({
          width: pageInfo.width,
          height: pageInfo.height,
        });

        // Calculate container dimensions and scaling with a small delay to ensure container is rendered
        setTimeout(() => {
          const container = containerRef.current;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            // Calculate scale to fit within the container while maintaining aspect ratio
            // Use shared scaling utility for consistency
            const scalingInfo = calculateScaling(
              pageInfo.width,
              pageInfo.height,
              containerWidth,
              containerHeight
            );

            setScale(scalingInfo.scale);
          } else {
            // Fallback if container not available
            setScale(1);
          }
        }, 100);

        // Convert canvas to image
        const img = new Image();
        img.onload = () => {
          setPdfImage(img);
          setIsLoading(false);
        };
        img.onerror = (error) => {
          console.error("Failed to load PDF image:", error);
          setPdfError("Failed to load PDF image");
          setIsLoading(false);
        };
        img.src = canvas.toDataURL();
      } catch (error) {
        console.error("Error loading PDF:", error);

        // Retry once if it's a worker-related error
        if (
          retryCount === 0 &&
          error instanceof Error &&
          error.message.includes("worker")
        ) {
          console.log("Retrying PDF load after worker error...");
          setTimeout(() => loadPdfAsImage(1), 1000);
          return;
        }

        setPdfError(
          error instanceof Error ? error.message : "Failed to load PDF"
        );
        setIsLoading(false);
      }
    },
    [templateFile]
  );

  useEffect(() => {
    if (templateFile?.data && !pdfImage) {
      loadPdfAsImage();
    }
  }, [templateFile, loadPdfAsImage, pdfImage]);

  // Handle window resize to recalculate scaling
  useEffect(() => {
    const handleResize = () => {
      if (pdfImage && containerRef.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // Calculate scale to fit within the container while maintaining aspect ratio
        const scaleX = containerWidth / stageSize.width;
        const scaleY = containerHeight / stageSize.height;
        const scaleToFit = Math.min(scaleX, scaleY); // Allow scaling up beyond 100%

        setScale(scaleToFit);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pdfImage, stageSize]);

  // Handle keyboard events for field deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedField) {
          onFieldDelete(selectedField.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedField, onFieldDelete]);

  // Update transformer when selected field changes
  useEffect(() => {
    if (selectedField && transformerRef.current) {
      const stage = stageRef.current;
      if (stage) {
        const selectedNode = stage.findOne(`#${selectedField.id}`);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer()?.batchDraw();
        }
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedField]);

  // Generate QR codes for QR fields
  useEffect(() => {
    const generateQRCodes = async () => {
      const qrFields = fields.filter((field) => field.type === "qr");
      const newQrImages = new Map<string, HTMLImageElement>();

      for (const field of qrFields) {
        try {
          // Generate a sample certificate ID for preview
          const sampleId = `CERT-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase()}`;
          const verificationUrl = generateVerificationURL(sampleId);
          const qrCodeDataURL = await generateQRCode(verificationUrl, {
            width: field.width,
            height: field.height,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
            margin: 1,
          });

          const img = new Image();
          img.src = qrCodeDataURL;
          newQrImages.set(field.id, img);
        } catch (error) {
          console.error("Error generating QR code for field:", field.id, error);
        }
      }

      setQrCodeImages(newQrImages);
    };

    if (fields.length > 0) {
      generateQRCodes();
    }
  }, [fields]);

  // Load signature images
  useEffect(() => {
    const loadSignatureImages = () => {
      const newSignatureImages = new Map<string, HTMLImageElement>();

      signatureImages.forEach((signature) => {
        const img = new Image();
        img.onload = () => {
          newSignatureImages.set(signature.id, img);
          setLoadedSignatureImages(new Map(newSignatureImages));
        };
        img.src = signature.dataUrl;
      });
    };

    if (signatureImages.length > 0) {
      loadSignatureImages();
    }
  }, [signatureImages]);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // If clicking on empty space, deselect
    if (e.target === e.target.getStage()) {
      onFieldSelect(null);
    }
  };

  const handleFieldClick = (field: TemplateField) => {
    onFieldSelect(field);
  };

  const handleFieldDragEnd = (
    field: TemplateField,
    e: KonvaEventObject<DragEvent>
  ) => {
    // Convert scaled coordinates back to original PDF coordinates
    const scaledX = e.target.x();
    const scaledY = e.target.y();
    const newX = scaledX / scale;
    const newY = scaledY / scale;

    onFieldUpdate(field.id, {
      x: newX,
      y: newY,
    });
  };

  const handleFieldResize = (
    field: TemplateField,
    e: KonvaEventObject<Event>
  ) => {
    const scaleX = e.target.scaleX();
    const scaleY = e.target.scaleY();

    onFieldUpdate(field.id, {
      width: Math.max(50, field.width * scaleX),
      height: Math.max(20, field.height * scaleY),
    });

    // Reset scale
    e.target.scaleX(1);
    e.target.scaleY(1);
  };

  const handleFieldRightClick = (
    field: TemplateField,
    e: KonvaEventObject<PointerEvent>
  ) => {
    e.evt.preventDefault();
    setContextMenuField(field);
    onFieldSelect(field);
  };

  const handleDeleteField = () => {
    if (contextMenuField) {
      onFieldDelete(contextMenuField.id);
      setContextMenuField(null);
    }
  };

  const handleEditFieldName = () => {
    if (contextMenuField) {
      setEditingFieldName(
        contextMenuField.label || getFieldLabel(contextMenuField.type)
      );
      setIsEditingFieldName(true);
      setContextMenuField(null);
    }
  };

  const handleSaveFieldName = () => {
    if (contextMenuField && editingFieldName.trim()) {
      onFieldUpdate(contextMenuField.id, { label: editingFieldName.trim() });
    }
    setIsEditingFieldName(false);
    setEditingFieldName("");
  };

  const handleCancelEditFieldName = () => {
    setIsEditingFieldName(false);
    setEditingFieldName("");
  };

  const getFieldLabel = (type: string) => {
    switch (type) {
      case "text":
        return "Text Field";
      case "date":
        return "Date Field";
      case "signature":
        return "Signature Field";
      case "certificateId":
        return "Certificate ID";
      case "qr":
        return "QR Code";
      default:
        return "Field";
    }
  };

  const renderPreviewField = (
    field: TemplateField,
    displayX: number,
    displayY: number,
    displayWidth: number,
    displayHeight: number,
    fieldKey: string
  ) => {
    // Show how the field will actually appear on the certificate
    switch (field.type) {
      case "text":
        return (
          <Group key={fieldKey} id={field.id}>
            <Text
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              text={field.placeholder || field.label || "Sample Text"}
              fontSize={(field.fontSize || 12) * scale}
              fontFamily={field.fontFamily || "Arial"}
              fill={field.color || "#1f2937"}
              align={field.textAlign || "left"}
              verticalAlign="top"
              wrap="word"
              listening={false}
              fontStyle={
                `${field.bold ? "bold" : ""} ${
                  field.italic ? "italic" : ""
                }`.trim() || "normal"
              }
              textDecoration={field.underline ? "underline" : "none"}
            />
            {/* Text baseline indicator in preview mode */}
            <Rect
              x={displayX}
              y={displayY + (field.fontSize || 12) * scale}
              width={displayWidth}
              height={1}
              fill="#e5e7eb"
              opacity={0.6}
              listening={false}
            />
            {/* Subtle border to show field boundaries */}
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth={0.5}
              dash={[2, 2]}
              listening={false}
            />
          </Group>
        );

      case "date":
        return (
          <Group key={fieldKey} id={field.id}>
            <Text
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              text={field.placeholder || field.label || "2024-01-01"}
              fontSize={(field.fontSize || 12) * scale}
              fontFamily={field.fontFamily || "Arial"}
              fill={field.color || "#1f2937"}
              align={field.textAlign || "left"}
              verticalAlign="top"
              wrap="word"
              listening={false}
              fontStyle={
                `${field.bold ? "bold" : ""} ${
                  field.italic ? "italic" : ""
                }`.trim() || "normal"
              }
              textDecoration={field.underline ? "underline" : "none"}
            />
            {/* Text baseline indicator in preview mode */}
            <Rect
              x={displayX}
              y={displayY + (field.fontSize || 12) * scale}
              width={displayWidth}
              height={1}
              fill="#e5e7eb"
              opacity={0.6}
              listening={false}
            />
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth={0.5}
              dash={[2, 2]}
              listening={false}
            />
          </Group>
        );

      case "signature":
        const signatureImage = field.signatureImageId
          ? loadedSignatureImages.get(field.signatureImageId)
          : null;

        return (
          <Group key={fieldKey} id={field.id}>
            {signatureImage ? (
              <KonvaImage
                image={signatureImage}
                x={displayX}
                y={displayY}
                width={displayWidth}
                height={displayHeight}
                cornerRadius={2}
                listening={false}
              />
            ) : (
              <Text
                x={displayX}
                y={displayY}
                width={displayWidth}
                height={displayHeight}
                text={field.placeholder || field.label || "Signature"}
                fontSize={(field.fontSize || 12) * scale}
                fontFamily={field.fontFamily || "Arial"}
                fill={field.color || "#1f2937"}
                align="center"
                verticalAlign="middle"
                wrap="word"
                listening={false}
                fontStyle="italic"
              />
            )}
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth={0.5}
              dash={[2, 2]}
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
              text={field.placeholder || field.label || "CERT-123456"}
              fontSize={(field.fontSize || 12) * scale}
              fontFamily={field.fontFamily || "Arial"}
              fill={field.color || "#1f2937"}
              align="left"
              verticalAlign="top"
              wrap="word"
              listening={false}
            />
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth={0.5}
              dash={[2, 2]}
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
              fill="#f3f4f6"
              stroke="#d1d5db"
              strokeWidth={1}
              listening={false}
            />
            <Text
              x={displayX + displayWidth / 2}
              y={displayY + displayHeight / 2}
              text="QR"
              fontSize={Math.min(displayWidth, displayHeight) * 0.3}
              fontFamily="Arial"
              fill="#6b7280"
              align="center"
              verticalAlign="middle"
              listening={false}
            />
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth={0.5}
              dash={[2, 2]}
              listening={false}
            />
          </Group>
        );

      default:
        return null;
    }
  };

  const renderField = (field: TemplateField) => {
    const isSelected = selectedField?.id === field.id;

    // Force re-render when field properties change - include all relevant properties
    const fieldKey = `${field.id}-${field.fontSize}-${field.fontFamily}-${field.color}-${field.placeholder}-${field.signatureImageId}-${field.bold}-${field.italic}-${field.underline}-${field.textAlign}`;

    // Convert original PDF coordinates to scaled display coordinates
    const displayX = field.x * scale;
    const displayY = field.y * scale;
    const displayWidth = field.width * scale;
    const displayHeight = field.height * scale;

    // In preview mode, show how the field will actually look on the certificate
    if (previewMode) {
      return renderPreviewField(
        field,
        displayX,
        displayY,
        displayWidth,
        displayHeight,
        fieldKey
      );
    }

    switch (field.type) {
      case "text":
        return (
          <Group key={fieldKey} id={field.id}>
            {/* Field background for better visibility */}
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill={
                isSelected
                  ? "rgba(59, 130, 246, 0.05)"
                  : "rgba(255, 255, 255, 0.8)"
              }
              stroke={isSelected ? "#3b82f6" : "#d1d5db"}
              strokeWidth={isSelected ? 2 : 1}
              dash={isSelected ? [4, 4] : [2, 2]}
              draggable
              onClick={() => handleFieldClick(field)}
              onDragEnd={(e) => handleFieldDragEnd(field, e)}
              onTransformEnd={(e) => handleFieldResize(field, e)}
              onContextMenu={(e) => handleFieldRightClick(field, e)}
            />
            {/* Text content with proper padding */}
            <Text
              key={`${fieldKey}-text`}
              x={displayX + 4}
              y={displayY + 4}
              width={displayWidth - 8}
              height={displayHeight - 8}
              text={
                field.placeholder || field.label || getFieldLabel(field.type)
              }
              fontSize={(field.fontSize || 12) * scale}
              fontFamily={field.fontFamily || "Arial"}
              fill={field.color || "#1f2937"}
              align={field.textAlign || "left"}
              verticalAlign="top"
              wrap="word"
              listening={false}
              fontStyle={
                `${field.bold ? "bold" : ""} ${
                  field.italic ? "italic" : ""
                }`.trim() || "normal"
              }
              textDecoration={field.underline ? "underline" : "none"}
            />
            {/* Text baseline indicator - shows where text will be placed */}
            <Rect
              x={displayX + 4}
              y={displayY + 4 + (field.fontSize || 12) * scale}
              width={displayWidth - 8}
              height={1}
              fill={isSelected ? "#3b82f6" : "#94a3b8"}
              opacity={0.6}
              listening={false}
            />
            {/* Corner indicators to show field boundaries */}
            <Rect
              x={displayX}
              y={displayY}
              width={4}
              height={4}
              fill={isSelected ? "#3b82f6" : "#94a3b8"}
              listening={false}
            />
            <Rect
              x={displayX + displayWidth - 4}
              y={displayY}
              width={4}
              height={4}
              fill={isSelected ? "#3b82f6" : "#94a3b8"}
              listening={false}
            />
            <Rect
              x={displayX}
              y={displayY + displayHeight - 4}
              width={4}
              height={4}
              fill={isSelected ? "#3b82f6" : "#94a3b8"}
              listening={false}
            />
            <Rect
              x={displayX + displayWidth - 4}
              y={displayY + displayHeight - 4}
              width={4}
              height={4}
              fill={isSelected ? "#3b82f6" : "#94a3b8"}
              listening={false}
            />
          </Group>
        );

      case "date":
        return (
          <Group key={fieldKey} id={field.id}>
            {/* Field background for better visibility */}
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill={
                isSelected
                  ? "rgba(34, 197, 94, 0.05)"
                  : "rgba(255, 255, 255, 0.8)"
              }
              stroke={isSelected ? "#22c55e" : "#d1d5db"}
              strokeWidth={isSelected ? 2 : 1}
              dash={isSelected ? [4, 4] : [2, 2]}
              draggable
              onClick={() => handleFieldClick(field)}
              onDragEnd={(e) => handleFieldDragEnd(field, e)}
              onTransformEnd={(e) => handleFieldResize(field, e)}
              onContextMenu={(e) => handleFieldRightClick(field, e)}
            />
            {/* Text content with proper padding */}
            <Text
              key={`${fieldKey}-text`}
              x={displayX + 4}
              y={displayY + 4}
              width={displayWidth - 8}
              height={displayHeight - 8}
              text={
                field.placeholder || field.label || getFieldLabel(field.type)
              }
              fontSize={(field.fontSize || 12) * scale}
              fontFamily={field.fontFamily || "Arial"}
              fill={field.color || "#1f2937"}
              align={field.textAlign || "left"}
              verticalAlign="top"
              wrap="word"
              listening={false}
              fontStyle={
                `${field.bold ? "bold" : ""} ${
                  field.italic ? "italic" : ""
                }`.trim() || "normal"
              }
              textDecoration={field.underline ? "underline" : "none"}
            />
            {/* Text baseline indicator - shows where text will be placed */}
            <Rect
              x={displayX + 4}
              y={displayY + 4 + (field.fontSize || 12) * scale}
              width={displayWidth - 8}
              height={1}
              fill={isSelected ? "#22c55e" : "#94a3b8"}
              opacity={0.6}
              listening={false}
            />
            {/* Corner indicators to show field boundaries */}
            <Rect
              x={displayX}
              y={displayY}
              width={4}
              height={4}
              fill={isSelected ? "#22c55e" : "#94a3b8"}
              listening={false}
            />
            <Rect
              x={displayX + displayWidth - 4}
              y={displayY}
              width={4}
              height={4}
              fill={isSelected ? "#22c55e" : "#94a3b8"}
              listening={false}
            />
            <Rect
              x={displayX}
              y={displayY + displayHeight - 4}
              width={4}
              height={4}
              fill={isSelected ? "#22c55e" : "#94a3b8"}
              listening={false}
            />
            <Rect
              x={displayX + displayWidth - 4}
              y={displayY + displayHeight - 4}
              width={4}
              height={4}
              fill={isSelected ? "#22c55e" : "#94a3b8"}
              listening={false}
            />
          </Group>
        );

      case "certificateId":
        return (
          <Group key={fieldKey} id={field.id}>
            {/* Field background for better visibility */}
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill={
                isSelected
                  ? "rgba(107, 114, 128, 0.05)"
                  : "rgba(255, 255, 255, 0.8)"
              }
              stroke={isSelected ? "#6b7280" : "#d1d5db"}
              strokeWidth={isSelected ? 2 : 1}
              dash={isSelected ? [4, 4] : [2, 2]}
              draggable
              onClick={() => handleFieldClick(field)}
              onDragEnd={(e) => handleFieldDragEnd(field, e)}
              onTransformEnd={(e) => handleFieldResize(field, e)}
              onContextMenu={(e) => handleFieldRightClick(field, e)}
            />
            {/* Text content with proper padding */}
            <Text
              key={`${fieldKey}-text`}
              x={displayX + 4}
              y={displayY + 4}
              width={displayWidth - 8}
              height={displayHeight - 8}
              text={field.label || getFieldLabel(field.type)}
              fontSize={(field.fontSize || 12) * scale}
              fontFamily={field.fontFamily || "Arial"}
              fill={field.color || "#374151"}
              align={field.textAlign || "center"}
              verticalAlign="top"
              wrap="word"
              listening={false}
              fontStyle={
                `${field.bold ? "bold" : ""} ${
                  field.italic ? "italic" : ""
                }`.trim() || "normal"
              }
              textDecoration={field.underline ? "underline" : "none"}
            />
            {/* Text baseline indicator - shows where text will be placed */}
            <Rect
              x={displayX + 4}
              y={displayY + 4 + (field.fontSize || 12) * scale}
              width={displayWidth - 8}
              height={1}
              fill={isSelected ? "#6b7280" : "#94a3b8"}
              opacity={0.6}
              listening={false}
            />
            {/* Corner indicators to show field boundaries */}
            <Rect
              x={displayX}
              y={displayY}
              width={4}
              height={4}
              fill={isSelected ? "#6b7280" : "#94a3b8"}
              listening={false}
            />
            <Rect
              x={displayX + displayWidth - 4}
              y={displayY}
              width={4}
              height={4}
              fill={isSelected ? "#6b7280" : "#94a3b8"}
              listening={false}
            />
            <Rect
              x={displayX}
              y={displayY + displayHeight - 4}
              width={4}
              height={4}
              fill={isSelected ? "#6b7280" : "#94a3b8"}
              listening={false}
            />
            <Rect
              x={displayX + displayWidth - 4}
              y={displayY + displayHeight - 4}
              width={4}
              height={4}
              fill={isSelected ? "#6b7280" : "#94a3b8"}
              listening={false}
            />
          </Group>
        );

      case "signature":
        const signatureImage = field.signatureImageId
          ? loadedSignatureImages.get(field.signatureImageId)
          : null;

        return (
          <Group key={fieldKey} id={field.id}>
            {/* Simple border for field area */}
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill="transparent"
              stroke={isSelected ? "#9333ea" : "#d1d5db"}
              strokeWidth={isSelected ? 2 : 1}
              dash={isSelected ? [4, 4] : [2, 2]}
              draggable
              onClick={() => handleFieldClick(field)}
              onDragEnd={(e) => handleFieldDragEnd(field, e)}
              onTransformEnd={(e) => handleFieldResize(field, e)}
              onContextMenu={(e) => handleFieldRightClick(field, e)}
            />
            {signatureImage ? (
              <KonvaImage
                image={signatureImage}
                x={displayX}
                y={displayY}
                width={displayWidth}
                height={displayHeight}
                listening={false}
              />
            ) : (
              <Text
                key={`${fieldKey}-text`}
                x={displayX}
                y={displayY}
                width={displayWidth}
                height={displayHeight}
                text={field.placeholder || field.label || "Signature"}
                fontSize={(field.fontSize || 12) * scale}
                fontFamily={field.fontFamily || "Arial"}
                fill={field.color || "#1f2937"}
                align="center"
                verticalAlign="middle"
                wrap="word"
                listening={false}
                fontStyle="italic"
              />
            )}
          </Group>
        );

      case "qr":
        const qrImage = qrCodeImages.get(field.id);
        return (
          <Group key={fieldKey} id={field.id}>
            {/* Simple border for field area */}
            <Rect
              x={displayX}
              y={displayY}
              width={displayWidth}
              height={displayHeight}
              fill="transparent"
              stroke={isSelected ? "#f97316" : "#d1d5db"}
              strokeWidth={isSelected ? 2 : 1}
              dash={isSelected ? [4, 4] : [2, 2]}
              draggable
              onClick={() => handleFieldClick(field)}
              onDragEnd={(e) => handleFieldDragEnd(field, e)}
              onTransformEnd={(e) => handleFieldResize(field, e)}
              onContextMenu={(e) => handleFieldRightClick(field, e)}
            />
            {qrImage ? (
              <KonvaImage
                image={qrImage}
                x={displayX}
                y={displayY}
                width={displayWidth}
                height={displayHeight}
                listening={false}
              />
            ) : (
              <Text
                key={`${fieldKey}-text`}
                x={displayX}
                y={displayY}
                width={displayWidth}
                height={displayHeight}
                text="QR Code"
                fontSize={(field.fontSize || 12) * scale}
                fontFamily={field.fontFamily || "Arial"}
                fill={field.color || "#374151"}
                align="center"
                verticalAlign="middle"
                wrap="word"
                listening={false}
              />
            )}
          </Group>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading certificate editor...
          </p>
        </div>
      </div>
    );
  }

  if (pdfError) {
    return (
      <div className="w-full h-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">
            Failed to load PDF
          </p>
          <p className="text-red-500 dark:text-red-400 text-sm mt-2">
            {pdfError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div
        ref={containerRef}
        className="relative bg-white overflow-hidden shadow-lg rounded-lg max-w-[90vw] max-h-[90vh]"
        style={{
          width: stageSize.width * scale * zoom,
          height: stageSize.height * scale * zoom,
        }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={scale * zoom}
          scaleY={scale * zoom}
          onClick={handleStageClick}
          className="cursor-crosshair"
        >
          <Layer>
            {/* PDF Template Background */}
            {pdfImage && (
              <KonvaImage
                image={pdfImage}
                width={stageSize.width}
                height={stageSize.height}
              />
            )}

            {/* Fields */}
            {fields.map(renderField)}

            {/* Transformer for selected field */}
            <Transformer
              ref={transformerRef}
              flipEnabled={false}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize
                if (
                  Math.abs(newBox.width) < 50 ||
                  Math.abs(newBox.height) < 20
                ) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>

      {/* Context Menu */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="hidden" />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleEditFieldName}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Name
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDeleteField} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Field
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Field Name Editing Modal */}
      {isEditingFieldName && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Field Name</h3>
            <Input
              value={editingFieldName}
              onChange={(e) => setEditingFieldName(e.target.value)}
              placeholder="Enter field name"
              className="mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelEditFieldName}>
                Cancel
              </Button>
              <Button onClick={handleSaveFieldName}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
