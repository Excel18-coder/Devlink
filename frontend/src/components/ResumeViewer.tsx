import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";

interface ResumeViewerProps {
  url: string;
  label?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * How it works:
 * Cloudinary serves PDFs with `Content-Disposition: attachment`, which makes
 * the browser download the file even inside an iframe. However, the
 * Content-Disposition header only applies to browser navigations — a
 * programmatic `fetch()` call ignores it completely.
 *
 * So we:
 *  1. fetch() the PDF bytes (Content-Disposition is irrelevant here)
 *  2. Turn the bytes into a local blob: URL via URL.createObjectURL()
 *  3. Load that blob URL in the iframe — browser renders it inline because
 *     blob: URLs are local resources with no headers to override them.
 */
export default function ResumeViewer({ url, label = "View Resume", size = "sm", className }: ResumeViewerProps) {
  const [open, setOpen]       = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  const handleOpen = async () => {
    setError(false);
    setOpen(true);

    // Only fetch once — reuse the blob URL on subsequent opens
    if (blobUrl) return;

    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      setBlobUrl(URL.createObjectURL(blob));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // Revoke the blob URL when the dialog is closed to free memory
    if (!next && blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
  };

  return (
    <>
      <Button variant="outline" size={size} className={className} onClick={handleOpen}>
        <FileText className="h-4 w-4 mr-1.5" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
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

          <div className="relative flex-1 overflow-hidden bg-muted/30">
            {/* Fetching bytes */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading resume…</p>
              </div>
            )}

            {/* Fetch failed */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 px-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive/50" />
                <p className="text-sm text-muted-foreground max-w-xs">
                  Could not load the resume. You can still open or download it directly.
                </p>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    Open in New Tab
                  </Button>
                </a>
              </div>
            )}

            {/* Blob URL loaded — browser renders inline, no Content-Disposition conflict */}
            {blobUrl && !error && (
              <iframe
                src={blobUrl}
                title="Resume"
                className="w-full h-full border-0"
                allow="fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

