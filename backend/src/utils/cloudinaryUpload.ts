import { Readable } from "stream";
import { cloudinary } from "../config/cloudinary.js";

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

export const uploadToCloudinary = (
  buffer: Buffer,
  options: { folder?: string; resource_type?: "auto" | "image" | "video" | "raw"; public_id?: string }
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
      resolve({ secureUrl: result.secure_url, publicId: result.public_id });
    });
    Readable.from(buffer).pipe(uploadStream);
  });
};
