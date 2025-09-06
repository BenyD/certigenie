import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, QrCode, Download, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                CertiGenie
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/verify">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Certificate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Generate Professional Certificates
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Upload your PDF template, add dynamic fields, and generate
            certificates with auto-generated IDs and QR codes. Perfect for
            events, courses, and achievements.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary" className="px-4 py-2">
              <QrCode className="h-4 w-4 mr-2" />
              Auto QR Codes
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <FileText className="h-4 w-4 mr-2" />
              PDF Templates
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Download className="h-4 w-4 mr-2" />
              Bulk Export
            </Badge>
          </div>
          <Link href="/upload">
            <Button size="lg" className="text-lg px-8 py-6">
              <Upload className="h-6 w-6 mr-2" />
              Start Creating Certificates
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Upload Template</CardTitle>
              <CardDescription>
                Upload your PDF certificate template and let our system analyze
                it automatically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Auto-Generate IDs</CardTitle>
              <CardDescription>
                Each certificate gets a unique ID and QR code for verification
                and authenticity
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Export & Share</CardTitle>
              <CardDescription>
                Export as PNG or PDF, bulk generate from CSV, and verify
                certificates locally
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it Works */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h3 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            How It Works
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Upload PDF</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Upload your certificate template
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Design Fields</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Place text, date, and signature fields
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Add Data</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enter recipient details or upload CSV
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold mb-2">Export</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Generate and download certificates
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
