import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE_BYTES = parseInt(process.env.UPLOAD_MAX_SIZE_BYTES || `${5 * 1024 * 1024}`, 10);
const ALLOWED_MIME_TYPES = (process.env.UPLOAD_ALLOWED_MIME_TYPES || "image/jpeg,image/png,image/webp,audio/mpeg,audio/wav")
  .split(",")
  .map((x) => x.trim());

export class UploadValidationError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
  }
}

export interface UploadResult {
  url: string;
  mimeType: string;
  size: number;
}

const validateFile = (file: Blob) => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new UploadValidationError("File too large", 413);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new UploadValidationError("Unsupported file type", 415);
  }
};

const ensureDirectory = async (directory: string) => {
  await fs.mkdir(directory, { recursive: true });
};

const uploadImageLocal = async (buffer: Buffer, uploadsDir: string): Promise<UploadResult> => {
  const filename = `${uuidv4()}.webp`;
  const filePath = path.join(uploadsDir, filename);
  const output = await sharp(buffer).resize(1024, 1024, { fit: "inside" }).webp().toBuffer();

  await fs.writeFile(filePath, output);

  return {
    url: `/uploads/${filename}`,
    mimeType: "image/webp",
    size: output.length,
  };
};

const uploadRawLocal = async (
  buffer: Buffer,
  uploadsDir: string,
  extension: string,
  mimeType: string
): Promise<UploadResult> => {
  const filename = `${uuidv4()}.${extension}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${filename}`,
    mimeType,
    size: buffer.length,
  };
};

const getExtensionFromMime = (mimeType: string) => {
  if (mimeType === "audio/mpeg") return "mp3";
  if (mimeType === "audio/wav") return "wav";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "bin";
};


const sanitizeTargetFolder = (targetFolder?: string): string => {
  const candidate = String(targetFolder || "uploads").trim().toLowerCase();
  const match = candidate.match(/^[a-z0-9_-]+$/);
  return match ? match[0] : "uploads";
};

export const saveUpload = async (file: Blob, targetFolder: string = "uploads"): Promise<UploadResult> => {
  validateFile(file);

  const storageDriver = process.env.UPLOAD_STORAGE_DRIVER || "local";
  if (storageDriver !== "local") {
    throw new UploadValidationError("local storage is currently configured will add s3 later", 501);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // sanitize target folder to a single safe segment to prevents path traversal)
  const safeFolderName = sanitizeTargetFolder(targetFolder);

  // resolve uploadsDir under the project's public directory and ensure it is contained there
  const publicBase = path.resolve(process.cwd(), "public");
  const uploadsDir = path.resolve(publicBase, safeFolderName);

  if (!uploadsDir.startsWith(publicBase + path.sep) && uploadsDir !== publicBase) {
    throw new UploadValidationError("Invalid upload target", 400);
  }

  await ensureDirectory(uploadsDir);

  const buildUrl = (filename: string) => path.posix.join("/", safeFolderName, filename);

  if (file.type.startsWith("image/")) {
    const filename = `${uuidv4()}.webp`;
    const filePath = path.join(uploadsDir, filename);
    const output = await sharp(buffer).resize(1024, 1024, { fit: "inside" }).webp().toBuffer();

    await fs.writeFile(filePath, output);

    return {
      url: buildUrl(filename),
      mimeType: "image/webp",
      size: output.length,
    };
  }

  const extension = getExtensionFromMime(file.type);
  const filename = `${uuidv4()}.${extension}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buffer);

  return {
    url: buildUrl(filename),
    mimeType: file.type || "application/octet-stream",
    size: buffer.length,
  };
};
