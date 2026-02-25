import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface ResumeViewerProps {
  url: string;
  label?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * How it works:
 *
 * Cloudinary serves uploaded PDFs with two problems:
 *   1. Content-Disposition: attachment  →  browser forces a download
 *   2. No CORS headers on raw uploads   →  browser blocks fetch() entirely
 *
 * Both are server-side headers; client-side tricks (blob URLs, Google Viewer,
 * etc.) cannot reliably work around them.
 *
 * Fix: route the PDF through our own backend (/api/proxy/pdf?url=...).
 *   • The backend fetches from Cloudinary server-to-server (no CORS issue).
 *   • It re-serves the bytes with Content-Disposition: inline.
 *   • The iframe points at our own origin, so the browser renders it inline.
 *
 * No fetch(), no blob URLs, no async state — just an iframe src.
 */
export default function ResumeViewer({ url, label = "View Resume", size = "sm", className }: ResumeViewerProps) {
  const [open, setOpen] = useState(false);

  // Build the proxy URL once — the iframe loads it directly, no client fetch needed
  const proxyUrl = `${API_BASE}/proxy/pdf?url=${encodeURIComponent(url)}`;

  return (
    <>
      <Button variant="outline" size={size} className={className} onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4 mr-1.5" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90dvh] flex flex-col p-0 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0 gap-3">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              Resume
            </DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </Button>
              </a>
              <a href={url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </a>
            </div>
          </DialogHeader>

          {/* The iframe points at our own backend proxy — renders inline, no download */}
          <div className="relative flex-1 overflow-hidden bg-muted/30">
            <iframe
              key={proxyUrl}
              src={open ? proxyUrl : undefined}
              title="Resume"
              className="w-full h-full border-0"
              allow="fullscreen"
              onError={() => {/* handled by browser's built-in PDF error UI */}}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


