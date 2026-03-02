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

import { Router } from "express";
import { Readable } from "stream";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const ALLOWED_HOSTNAME = "res.cloudinary.com";

function isAllowedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.hostname === ALLOWED_HOSTNAME;
  } catch {
    return false;
  }
}

router.get("/pdf", asyncHandler(async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Missing url query parameter" });
    return;
  }

  if (!isAllowedUrl(url)) {
    res.status(400).json({ error: "Only Cloudinary URLs are allowed" });
    return;
  }

  try {
    const upstream = await fetch(url, {
      // Abort the upstream fetch after 15 s to avoid holding the connection open
      signal: AbortSignal.timeout(15_000),
      headers: {
        // Some CDN edges vary responses on Accept; request PDF explicitly
        Accept: "application/pdf,*/*;q=0.9",
        "User-Agent": "Devlink-Proxy/1.0",
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream returned non-OK status" });
      return;
    }

    if (!upstream.body) {
      res.status(502).json({ error: "No response body from upstream" });
      return;
    }

    // Enforce a 20 MB cap so a malicious Cloudinary URL can't exhaust memory
    const MAX_BYTES = 20 * 1024 * 1024;
    const contentLength = upstream.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BYTES) {
      res.status(413).json({ error: "File too large to proxy" });
      return;
    }

    // Determine content type from upstream; default to PDF
    const upstreamType = upstream.headers.get("content-type") ?? "";
    const contentType = upstreamType.includes("pdf")
      ? "application/pdf"
      : upstreamType || "application/pdf";

    res.set({
      "Content-Type": contentType,
      // 'inline' tells the browser to render in-page rather than download
      "Content-Disposition": "inline",
      // Cache privately for 1 hour — no need to re-fetch on every open
      "Cache-Control": "private, max-age=3600",
      // Pass through content-length if present so the browser can show progress
      ...(upstream.headers.get("content-length")
        ? { "Content-Length": upstream.headers.get("content-length")! }
        : {}),
    });

    // Stream the body directly to the client — no full buffering in memory
    const nodeReadable = Readable.fromWeb(
      upstream.body as Parameters<typeof Readable.fromWeb>[0]
    );

    // Enforce size cap at stream level — reject if upstream sends more than allowed
    let bytesSent = 0;
    nodeReadable.on("data", (chunk: Buffer) => {
      bytesSent += chunk.length;
      if (bytesSent > MAX_BYTES) {
        nodeReadable.destroy(new Error("File too large"));
      }
    });

    nodeReadable.pipe(res);

    nodeReadable.on("error", () => {
      if (!res.headersSent) {
        res.status(502).json({ error: "Stream error" });
      } else {
        res.destroy();
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[proxy/pdf] fetch error:", err);
    if (!res.headersSent) {
      res.status(502).json({ error: "Failed to fetch from upstream" });
    }
  }
}));

export default router;
