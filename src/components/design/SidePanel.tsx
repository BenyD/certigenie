"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  FileText,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PenTool,
} from "lucide-react";
import Image from "next/image";
import FieldLibrary from "./FieldLibrary";

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

interface SignatureImage {
  id: string;
  name: string;
  dataUrl: string;
  file: File;
}

interface SidePanelProps {
  fields: TemplateField[];
  selectedField: TemplateField | null;
  signatureImages: SignatureImage[];
  onAddField: (type: TemplateField["type"]) => void;
  onUpdateField: (fieldId: string, updates: Partial<TemplateField>) => void;
  onDeleteField: (fieldId: string) => void;
  onSignatureUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteSignature: (signatureId: string) => void;
  onDragStart?: (type: TemplateField["type"]) => void;
  onSelectField?: (field: TemplateField | null) => void;
}

export default function SidePanel({
  fields,
  selectedField,
  signatureImages,
  onAddField,
  onUpdateField,
  onDeleteField,
  onSignatureUpload,
  onDeleteSignature,
  onDragStart,
  onSelectField,
}: SidePanelProps) {
  const getFieldDisplayName = (field: TemplateField) => {
    return (
      field.label ||
      field.placeholder ||
      field.type.charAt(0).toUpperCase() + field.type.slice(1)
    );
  };

  const toggleBold = () => {
    if (selectedField) {
      onUpdateField(selectedField.id, { bold: !selectedField.bold });
    }
  };

  const toggleItalic = () => {
    if (selectedField) {
      onUpdateField(selectedField.id, { italic: !selectedField.italic });
    }
  };

  const toggleUnderline = () => {
    if (selectedField) {
      onUpdateField(selectedField.id, { underline: !selectedField.underline });
    }
  };

  const setTextAlign = (align: "left" | "center" | "right") => {
    if (selectedField) {
      onUpdateField(selectedField.id, { textAlign: align });
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          Design Tools
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Add fields and customize your certificate
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="fields" className="w-full h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger
                value="fields"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-purple-400"
              >
                Fields
              </TabsTrigger>
              <TabsTrigger
                value="added"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-purple-400"
              >
                Added
              </TabsTrigger>
              <TabsTrigger
                value="signatures"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-purple-400"
              >
                Signatures
              </TabsTrigger>
              <TabsTrigger
                value="properties"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-purple-400"
              >
                Properties
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="fields" className="p-0 pb-8 flex-1">
            <FieldLibrary
              onAddField={onAddField}
              onDragStart={onDragStart || (() => {})}
            />
          </TabsContent>

          <TabsContent value="added" className="p-6 pb-8 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Added Fields
              </h3>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                {fields.length} field{fields.length !== 1 ? "s" : ""}
              </span>
            </div>

            {fields.length > 0 ? (
              <div className="space-y-3">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedField?.id === field.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10"
                    }`}
                    onClick={() => onSelectField?.(field)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          field.type === "text"
                            ? "bg-blue-500"
                            : field.type === "date"
                            ? "bg-green-500"
                            : field.type === "signature"
                            ? "bg-purple-500"
                            : field.type === "qr"
                            ? "bg-orange-500"
                            : "bg-gray-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
                          {getFieldDisplayName(field)}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {field.type} • {field.width}×{field.height}px
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          field.type === "text"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : field.type === "date"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : field.type === "signature"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            : field.type === "qr"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {field.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteField(field.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No fields added yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Drag fields from the library to add them
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="signatures" className="p-6 pb-8 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Signature Management
              </h3>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              >
                {signatureImages.length}
              </Badge>
            </div>

            {/* Signature Upload */}
            <div className="mb-6">
              <Label
                htmlFor="signature-upload"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Upload Signature
              </Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                <input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={onSignatureUpload}
                  className="hidden"
                />
                <label
                  htmlFor="signature-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3">
                    <PenTool className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Click to upload signature
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
            </div>

            {signatureImages.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Uploaded Signatures
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  >
                    {signatureImages.length}
                  </Badge>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {signatureImages.map((signature) => {
                    // Count how many fields are using this signature
                    const usageCount = fields.filter(
                      (field) =>
                        field.type === "signature" &&
                        field.signatureImageId === signature.id
                    ).length;

                    return (
                      <div
                        key={signature.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Image
                            src={signature.dataUrl}
                            alt={signature.name}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {signature.name}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.round(signature.file.size / 1024)}KB
                              </p>
                              {usageCount > 0 && (
                                <>
                                  <span className="text-xs text-gray-400">
                                    •
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  >
                                    Used in {usageCount} field
                                    {usageCount !== 1 ? "s" : ""}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {usageCount === 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            >
                              Unused
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteSignature(signature.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete signature"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Signature Usage Summary */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        Signature Usage Summary:
                      </p>
                      <ul className="space-y-1">
                        <li>• Total signatures: {signatureImages.length}</li>
                        <li>
                          • Signature fields:{" "}
                          {fields.filter((f) => f.type === "signature").length}
                        </li>
                        <li>
                          • Fields with signatures:{" "}
                          {
                            fields.filter(
                              (f) =>
                                f.type === "signature" && f.signatureImageId
                            ).length
                          }
                        </li>
                        <li>
                          • Unused signatures:{" "}
                          {
                            signatureImages.filter(
                              (sig) =>
                                !fields.some(
                                  (f) =>
                                    f.type === "signature" &&
                                    f.signatureImageId === sig.id
                                )
                            ).length
                          }
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="properties" className="p-6 pb-8 space-y-6 flex-1">
            {selectedField ? (
              <>
                {/* Field Info Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        selectedField.type === "text"
                          ? "bg-blue-500"
                          : selectedField.type === "date"
                          ? "bg-green-500"
                          : selectedField.type === "signature"
                          ? "bg-purple-500"
                          : selectedField.type === "qr"
                          ? "bg-orange-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {getFieldDisplayName(selectedField)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedField.type} field • {selectedField.width}×
                        {selectedField.height}px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Field Name */}
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                    Field Name
                  </Label>
                  <Input
                    value={selectedField.name || ""}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, { name: e.target.value })
                    }
                    placeholder="Enter field name (e.g., 'Name', 'Email', 'Date')"
                    className="mt-2 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This will be shown as the input label in the data entry page
                  </p>
                </div>

                {/* Field Label */}
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                    Field Label
                  </Label>
                  <Input
                    value={selectedField.label || ""}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, { label: e.target.value })
                    }
                    placeholder="Enter field label"
                    className="mt-2 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This will be shown as placeholder text in the field
                  </p>
                </div>

                {/* Text Formatting */}
                {(selectedField.type === "text" ||
                  selectedField.type === "date") && (
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                          Text Formatting
                        </Label>
                        <div className="flex space-x-2 mt-3">
                          <Button
                            variant={selectedField.bold ? "default" : "outline"}
                            size="sm"
                            onClick={toggleBold}
                            title="Bold"
                            className={
                              selectedField.bold
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            }
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              selectedField.italic ? "default" : "outline"
                            }
                            size="sm"
                            onClick={toggleItalic}
                            title="Italic"
                            className={
                              selectedField.italic
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            }
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              selectedField.underline ? "default" : "outline"
                            }
                            size="sm"
                            onClick={toggleUnderline}
                            title="Underline"
                            className={
                              selectedField.underline
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            }
                          >
                            <Underline className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                          Text Alignment
                        </Label>
                        <div className="flex space-x-2 mt-3">
                          <Button
                            variant={
                              selectedField.textAlign === "left"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setTextAlign("left")}
                            title="Align Left"
                            className={
                              selectedField.textAlign === "left"
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            }
                          >
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              selectedField.textAlign === "center"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setTextAlign("center")}
                            title="Align Center"
                            className={
                              selectedField.textAlign === "center"
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            }
                          >
                            <AlignCenter className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              selectedField.textAlign === "right"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setTextAlign("right")}
                            title="Align Right"
                            className={
                              selectedField.textAlign === "right"
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            }
                          >
                            <AlignRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Font Properties */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Font Size
                      </Label>
                      <select
                        value={selectedField.fontSize || 16}
                        onChange={(e) =>
                          onUpdateField(selectedField.id, {
                            fontSize: parseInt(e.target.value),
                          })
                        }
                        className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        {[
                          8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72,
                        ].map((size) => (
                          <option key={size} value={size}>
                            {size}px
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Font Family
                      </Label>
                      <select
                        value={selectedField.fontFamily || "Arial"}
                        onChange={(e) =>
                          onUpdateField(selectedField.id, {
                            fontFamily: e.target.value,
                          })
                        }
                        style={{
                          fontFamily: selectedField.fontFamily || "Arial",
                        }}
                        className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </select>
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                      Text Color
                    </Label>
                    <div className="mt-2 flex items-center space-x-3">
                      <input
                        type="color"
                        value={selectedField.color || "#000000"}
                        onChange={(e) =>
                          onUpdateField(selectedField.id, {
                            color: e.target.value,
                          })
                        }
                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                      />
                      <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono">
                        {selectedField.color || "#000000"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature Selection */}
                {selectedField.type === "signature" && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Signature Image
                      </Label>
                      <select
                        value={selectedField.signatureImageId || ""}
                        onChange={(e) =>
                          onUpdateField(selectedField.id, {
                            signatureImageId: e.target.value || undefined,
                          })
                        }
                        className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">Select signature image</option>
                        {signatureImages.map((sig) => (
                          <option key={sig.id} value={sig.id}>
                            {sig.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Signature Preview */}
                    {selectedField.signatureImageId && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Preview
                        </Label>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                          {(() => {
                            const signature = signatureImages.find(
                              (sig) => sig.id === selectedField.signatureImageId
                            );
                            return signature ? (
                              <div className="flex items-center space-x-3">
                                <Image
                                  src={signature.dataUrl}
                                  alt={signature.name}
                                  width={40}
                                  height={40}
                                  className="rounded border border-gray-200 dark:border-gray-600 object-cover"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {signature.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {Math.round(signature.file.size / 1024)}KB
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onUpdateField(selectedField.id, {
                                      signatureImageId: undefined,
                                    })
                                  }
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Signature Usage Info */}
                    {signatureImages.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            <p className="font-medium mb-1">
                              Signature Management:
                            </p>
                            <ul className="space-y-1">
                              <li>
                                • Each signature field can use a different
                                signature
                              </li>
                              <li>
                                • Upload multiple signatures to use across
                                different fields
                              </li>
                              <li>
                                • Signatures are automatically scaled to fit the
                                field size
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Position Controls */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                      Position & Size
                    </Label>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          X Position
                        </Label>
                        <Input
                          type="number"
                          value={selectedField.x}
                          onChange={(e) =>
                            onUpdateField(selectedField.id, {
                              x: Number(e.target.value),
                            })
                          }
                          className="mt-1 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Y Position
                        </Label>
                        <Input
                          type="number"
                          value={selectedField.y}
                          onChange={(e) =>
                            onUpdateField(selectedField.id, {
                              y: Number(e.target.value),
                            })
                          }
                          className="mt-1 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Width
                        </Label>
                        <Input
                          type="number"
                          value={selectedField.width}
                          onChange={(e) =>
                            onUpdateField(selectedField.id, {
                              width: Number(e.target.value),
                            })
                          }
                          className="mt-1 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Height
                        </Label>
                        <Input
                          type="number"
                          value={selectedField.height}
                          onChange={(e) =>
                            onUpdateField(selectedField.id, {
                              height: Number(e.target.value),
                            })
                          }
                          className="mt-1 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete Field */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteField(selectedField.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Field
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Field Selected
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Select a field from the canvas to edit its properties
                </p>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  Click on any field to get started
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
