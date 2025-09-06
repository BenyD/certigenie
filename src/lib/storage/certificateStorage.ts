import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface TemplateField {
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
}

interface CertificateDB extends DBSchema {
  certificates: {
    key: string;
    value: {
      id: string;
      certificateId: string;
      recipientName: string;
      recipientData: Record<string, string>;
      templateId: string;
      createdAt: number;
      qrCode: string;
      verificationUrl: string;
    };
  };
  templates: {
    key: string;
    value: {
      id: string;
      name: string;
      fileData: string;
      fields: TemplateField[];
      createdAt: number;
    };
  };
}

let db: IDBPDatabase<CertificateDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<CertificateDB>> {
  if (db) return db;

  db = await openDB<CertificateDB>("certigenie-db", 1, {
    upgrade(db) {
      db.createObjectStore("certificates", { keyPath: "id" });
      db.createObjectStore("templates", { keyPath: "id" });
    },
  });

  return db;
}

export interface CertificateData {
  id: string;
  certificateId: string;
  recipientName: string;
  recipientData: Record<string, string>;
  templateId: string;
  createdAt: number;
  qrCode: string;
  verificationUrl: string;
}

export async function saveCertificate(
  certificate: CertificateData
): Promise<void> {
  const database = await initDB();
  await database.put("certificates", certificate);
}

export async function getCertificate(
  certificateId: string
): Promise<CertificateData | null> {
  const database = await initDB();
  // First try to get by certificateId directly
  let certificate: CertificateData | null =
    (await database.get("certificates", certificateId)) || null;

  // If not found, search by certificateId field
  if (!certificate) {
    const allCertificates = await database.getAll("certificates");
    const foundCertificate = allCertificates.find(
      (cert) => cert.certificateId === certificateId
    );
    certificate = foundCertificate || null;
  }

  return certificate;
}

export async function getAllCertificates(): Promise<CertificateData[]> {
  const database = await initDB();
  return await database.getAll("certificates");
}

export async function deleteCertificate(certificateId: string): Promise<void> {
  const database = await initDB();
  await database.delete("certificates", certificateId);
}

export interface TemplateData {
  id: string;
  name: string;
  fileData: string;
  fields: TemplateField[];
  createdAt: number;
}

export async function saveTemplate(template: TemplateData): Promise<void> {
  const database = await initDB();
  await database.put("templates", template);
}

export async function getTemplate(
  templateId: string
): Promise<TemplateData | null> {
  const database = await initDB();
  return (await database.get("templates", templateId)) || null;
}

export async function getAllTemplates(): Promise<TemplateData[]> {
  const database = await initDB();
  return await database.getAll("templates");
}
