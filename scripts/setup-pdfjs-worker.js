#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Copy PDF.js worker to public directory
const sourcePath = path.join(
  __dirname,
  "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
);
const destPath = path.join(__dirname, "../public/pdfjs/pdf.worker.min.js");

try {
  // Ensure destination directory exists
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy the worker file
  fs.copyFileSync(sourcePath, destPath);
  console.log("✅ PDF.js worker copied to public/pdfjs/");
} catch (error) {
  console.error("❌ Failed to copy PDF.js worker:", error.message);
  console.log("The app will fall back to CDN sources.");
}
