"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, PenTool, QrCode, Hash, Type } from "lucide-react";

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

interface FieldLibraryProps {
  onAddField: (type: TemplateField["type"]) => void;
  onDragStart: (type: TemplateField["type"]) => void;
}

interface FieldCategory {
  id: string;
  name: string;
  description: string;
  fields: FieldType[];
}

interface FieldType {
  type: TemplateField["type"];
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultSize: { width: number; height: number };
}

const fieldTypes: FieldType[] = [
  {
    type: "text",
    name: "Text Field",
    description: "Add text content like names, titles, descriptions",
    icon: Type,
    color: "bg-blue-500",
    defaultSize: { width: 120, height: 28 },
  },
  {
    type: "date",
    name: "Date Field",
    description: "Display dates in various formats",
    icon: Calendar,
    color: "bg-green-500",
    defaultSize: { width: 100, height: 28 },
  },
  {
    type: "signature",
    name: "Signature",
    description: "Place signature images or text",
    icon: PenTool,
    color: "bg-purple-500",
    defaultSize: { width: 140, height: 50 },
  },
  {
    type: "qr",
    name: "QR Code",
    description: "Generate QR codes for verification",
    icon: QrCode,
    color: "bg-orange-500",
    defaultSize: { width: 60, height: 60 },
  },
  {
    type: "certificateId",
    name: "Certificate ID",
    description: "Unique identifier for the certificate",
    icon: Hash,
    color: "bg-gray-500",
    defaultSize: { width: 110, height: 28 },
  },
];

const fieldCategories: FieldCategory[] = [
  {
    id: "basic",
    name: "Basic Fields",
    description: "Essential text and data fields",
    fields: fieldTypes.filter((field) =>
      ["text", "date", "certificateId"].includes(field.type)
    ),
  },
  {
    id: "visual",
    name: "Visual Elements",
    description: "Images, signatures, and visual components",
    fields: fieldTypes.filter((field) =>
      ["signature", "qr"].includes(field.type)
    ),
  },
];

export default function FieldLibrary({
  onAddField,
  onDragStart,
}: FieldLibraryProps) {
  const [draggedField, setDraggedField] = useState<
    TemplateField["type"] | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = fieldCategories
    .map((category) => ({
      ...category,
      fields: category.fields.filter(
        (field) =>
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.fields.length > 0);

  const handleDragStart = (fieldType: TemplateField["type"]) => {
    setDraggedField(fieldType);
    onDragStart(fieldType);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  const handleFieldClick = (fieldType: TemplateField["type"]) => {
    onAddField(fieldType);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="px-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Type className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Field Categories */}
      <div className="space-y-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="px-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                {category.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {category.description}
              </p>
            </div>

            <div className="space-y-3">
              {category.fields.map((field) => {
                const IconComponent = field.icon;
                const isDragging = draggedField === field.type;

                return (
                  <div
                    key={field.type}
                    draggable
                    onDragStart={() => handleDragStart(field.type)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleFieldClick(field.type)}
                    className={`
                      group relative p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300
                      ${
                        isDragging
                          ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20 scale-95 shadow-lg"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 hover:shadow-md"
                      }
                    `}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div
                        className={`
                        flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm
                        ${field.color}
                        ${
                          isDragging
                            ? "opacity-70"
                            : "group-hover:scale-110 group-hover:shadow-lg"
                        }
                        transition-all duration-200
                      `}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {field.name}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          >
                            {field.defaultSize.width}×{field.defaultSize.height}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {field.description}
                        </p>
                      </div>
                    </div>

                    {/* Drag indicator */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col space-y-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
