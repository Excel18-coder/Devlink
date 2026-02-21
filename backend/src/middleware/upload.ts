import multer from "multer";

// Use memory storage — files are uploaded directly to Cloudinary
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WEBP and PDF files are allowed"));
    }
  }
});

// Submission upload — accepts ZIP archives and common file types
export const uploadSubmission = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const isArchive = name.endsWith(".zip") || name.endsWith(".tar.gz") || name.endsWith(".rar") || name.endsWith(".7z");
    const isAllowedMime = [
      "application/zip",
      "application/x-zip",
      "application/x-zip-compressed",
      "application/octet-stream",
      "image/jpeg", "image/png", "image/webp",
      "application/pdf"
    ].includes(file.mimetype);
    if (isArchive || isAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP archives, images, and PDF files are allowed for submissions"));
    }
  }
});
