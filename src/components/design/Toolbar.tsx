"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

interface ToolbarProps {
  onContinue: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  previewMode?: boolean;
  onTogglePreview?: () => void;
}

export default function Toolbar({
  onContinue,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  previewMode = false,
  onTogglePreview,
}: ToolbarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-2">
            <Link href="/upload">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          {/* Center - Zoom Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomOut}
                disabled={zoom <= 0.5}
                className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <div className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomIn}
                disabled={zoom >= 3}
                className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomReset}
                className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview Mode Toggle */}
            {onTogglePreview && (
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onTogglePreview}
                  className={`h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600 ${
                    previewMode ? "bg-blue-100 dark:bg-blue-900" : ""
                  }`}
                  title={previewMode ? "Hide Preview" : "Show Preview"}
                >
                  {previewMode ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            <Button
              onClick={onContinue}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              Continue to Data
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
