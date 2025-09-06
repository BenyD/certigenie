"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { fileToBase64DataURL } from "@/lib/utils/fileUtils";

export default function UploadPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file only.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    // Warn for large files that might cause performance issues
    if (file.size > 5 * 1024 * 1024) {
      console.warn("Large file detected. Processing may take longer.");
    }

    setError(null);
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const handleContinue = async () => {
    if (uploadedFile) {
      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Store file metadata
        sessionStorage.setItem(
          "templateFile",
          JSON.stringify({
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type,
            lastModified: uploadedFile.lastModified,
          })
        );

        // Simulate progress for file processing
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        // Convert file to base64 data URL using the efficient utility
        const dataUrl = await fileToBase64DataURL(uploadedFile);
        sessionStorage.setItem("templateFileData", dataUrl);

        // Complete the progress
        clearInterval(progressInterval);
        setUploadProgress(100);
        setIsUploading(false);

        router.push("/design");
      } catch (error) {
        console.error("Error processing file:", error);
        setError("Failed to process file. Please try again.");
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                CertiGenie
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/verify">
                <Button variant="outline" size="sm">
                  Verify Certificate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Upload Your Certificate Template
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Upload a PDF file to start creating your certificate template
            </p>
          </div>

          {/* Upload Area */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Template Upload
              </CardTitle>
              <CardDescription>
                Drag and drop your PDF certificate template here, or click to
                browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {isDragActive
                        ? "Drop the PDF here"
                        : "Choose PDF file or drag it here"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      PDF files only, max 10MB
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <Alert className="mt-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {uploadedFile && !isUploading && (
                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully uploaded: <strong>{uploadedFile.name}</strong>{" "}
                    ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* File Info */}
          {uploadedFile && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>File Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Name:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {uploadedFile.name}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Size:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Type:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {uploadedFile.type}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Last Modified:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(uploadedFile.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Button
              onClick={handleContinue}
              disabled={!uploadedFile || isUploading}
              className="min-w-[120px]"
            >
              Continue to Design
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
