export interface CloudinaryUploadResult {
    secureUrl: string;
    publicId: string;
}
export declare const uploadToCloudinary: (buffer: Buffer, options: {
    folder?: string;
    resource_type?: "auto" | "image" | "video" | "raw";
    public_id?: string;
}) => Promise<CloudinaryUploadResult>;
