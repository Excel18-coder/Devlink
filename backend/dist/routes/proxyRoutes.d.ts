/**
 * PDF Proxy Route — GET /api/proxy/pdf?url=<encoded-cloudinary-url>
 *
 * Why this exists:
 * Cloudinary serves uploaded files (including PDFs) with:
 *   Content-Disposition: attachment
 *   (no CORS headers for cross-origin fetch)
 *
 * This means the browser either:
 *   a) Blocks the fetch() entirely (CORS), or
 *   b) Forces a download instead of inline rendering (Content-Disposition)
 *
 * Fix: the backend fetches from Cloudinary server-to-server (no CORS restrictions),
 * then re-serves the bytes with Content-Disposition: inline so the browser
 * renders the PDF in an <iframe> instead of downloading it.
 *
 * Security:
 * - Only Cloudinary URLs are allowed (SSRF prevention).
 * - Response body is streamed, not stored.
 * - Result is cached at the CDN/client for 1 hour (private).
 */
declare const router: import("express-serve-static-core").Router;
export default router;
