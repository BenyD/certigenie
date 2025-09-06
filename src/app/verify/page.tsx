"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import {
  getCertificate,
  getAllCertificates,
  CertificateData,
} from "@/lib/storage/certificateStorage";

interface VerificationResult {
  isValid: boolean;
  certificateId?: string;
  recipientName?: string;
  date?: string;
  signature?: string;
  createdAt?: string;
  verificationUrl?: string;
  error?: string;
}

export default function VerifyPage() {
  const [certificateId, setCertificateId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [allCertificates, setAllCertificates] = useState<CertificateData[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const verifyCertificate = useCallback(
    async (id?: string) => {
      const certId = id || certificateId.trim();

      if (!certId) {
        setResult({
          isValid: false,
          error: "Please enter a certificate ID",
        });
        return;
      }

      setIsVerifying(true);
      setResult(null);

      try {
        // Simulate verification delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Look up certificate in IndexedDB
        const certificate = await getCertificate(certId);

        if (certificate) {
          setResult({
            isValid: true,
            certificateId: certificate.certificateId,
            recipientName: certificate.recipientName,
            date:
              certificate.recipientData.date ||
              new Date(certificate.createdAt).toLocaleDateString(),
            signature: certificate.recipientData.signature || "Not provided",
            createdAt: new Date(certificate.createdAt).toLocaleString(),
            verificationUrl: certificate.verificationUrl,
          });
        } else {
          setResult({
            isValid: false,
            error:
              "Certificate not found. This certificate may not exist or may have been deleted.",
          });
        }
      } catch (error) {
        console.error("Verification error:", error);
        setResult({
          isValid: false,
          error: "Verification failed. Please try again.",
        });
      } finally {
        setIsVerifying(false);
      }
    },
    [certificateId]
  );

  // Check for certificate ID in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get("certificateId");
    if (idFromUrl) {
      setCertificateId(idFromUrl);
      // Auto-verify if ID is in URL
      setTimeout(() => {
        verifyCertificate(idFromUrl);
      }, 500);
    }
  }, [verifyCertificate]);

  // Load all certificates for debugging
  useEffect(() => {
    const loadAllCertificates = async () => {
      try {
        const certificates = await getAllCertificates();
        setAllCertificates(certificates);
      } catch (error) {
        console.error("Error loading certificates:", error);
      }
    };
    loadAllCertificates();
  }, []);

  const handleQrCodeScan = () => {
    // In a real implementation, you'd integrate with a QR code scanner
    alert(
      "QR code scanning would be implemented here. For now, please enter the certificate ID manually."
    );
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
              <Link href="/upload">
                <Button variant="outline" size="sm">
                  Create Certificate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Verify Certificate
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Enter a certificate ID or scan a QR code to verify authenticity
            </p>
          </div>

          {/* Verification Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Certificate Verification
              </CardTitle>
              <CardDescription>
                Verify the authenticity of a certificate by entering its ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="certificateId">Certificate ID</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="certificateId"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      placeholder="Enter certificate ID (e.g., CERT-1234567890-ABC123)"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleQrCodeScan}
                      variant="outline"
                      size="icon"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => verifyCertificate()}
                  disabled={isVerifying || !certificateId.trim()}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify Certificate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Verification Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {result.isValid ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2 text-red-600" />
                  )}
                  Verification Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.isValid ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Certificate is valid!</strong> This certificate
                        has been verified and is authentic.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Certificate ID
                        </Label>
                        <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          {result.certificateId}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Recipient
                        </Label>
                        <p className="text-sm">{result.recipientName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Date
                        </Label>
                        <p className="text-sm">{result.date}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Signature
                        </Label>
                        <p className="text-sm">{result.signature}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Created At
                        </Label>
                        <p className="text-sm">{result.createdAt}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Verification URL
                        </Label>
                        <p className="text-sm break-all text-blue-600 dark:text-blue-400">
                          <a
                            href={result.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {result.verificationUrl}
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                      <Badge variant="outline">Authentic</Badge>
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Certificate verification failed.</strong>{" "}
                      {result.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Debug Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Debug Information
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                >
                  {showDebugInfo ? "Hide" : "Show"} Debug
                </Button>
              </CardTitle>
            </CardHeader>
            {showDebugInfo && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      All Certificates in Database:
                    </h4>
                    {allCertificates.length > 0 ? (
                      <div className="space-y-2">
                        {allCertificates.map((cert) => (
                          <div
                            key={cert.id}
                            className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-mono text-sm">
                                  {cert.certificateId}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {cert.recipientName} -{" "}
                                  {new Date(cert.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCertificateId(cert.certificateId);
                                  verifyCertificate(cert.certificateId);
                                }}
                              >
                                Verify This
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No certificates found in database.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                How to Verify
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Certificate ID Format</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Certificate IDs follow the format:{" "}
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                    CERT-{`{timestamp}`}-{`{random}`}
                  </code>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">QR Code Verification</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can also scan the QR code on the certificate to
                  automatically fill in the certificate ID.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Verification Process</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our verification system checks the certificate ID against our
                  local database to ensure authenticity and prevent fraud.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
