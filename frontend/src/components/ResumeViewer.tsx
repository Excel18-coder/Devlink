import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Maximize2, Loader2 } from "lucide-react";

interface ResumeViewerProps {
  url: string;
  /** Text shown on the trigger button. Default: "View Resume" */
  label?: string;
  /** Button size passed to <Button>. Default: "sm" */
  size?: "sm" | "default" | "lg";
  /** Extra classes on the trigger button */
  className?: string;
}

/**
 * Opens a full-screen-ish dialog with an <iframe> so the PDF renders
 * directly in the browser without triggering a download.
 *
 * Falls back to a "Open in new tab" link in case the browser blocks iframes
 * for the Cloudinary origin (very rare in practice).
 */
export default function ResumeViewer({ url, label = "View Resume", size = "sm", className }: ResumeViewerProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleOpen = () => {
    setLoaded(false);
    setError(false);
    setOpen(true);
  };

  return (
    <>
      <Button variant="outline" size={size} className={className} onClick={handleOpen}>
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
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </a>
          </DialogHeader>

          <div className="relative flex-1 overflow-hidden bg-muted/30">
            {/* Loading spinner */}
            {!loaded && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading PDF…</p>
              </div>
            )}

            {/* Error fallback */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 px-4 text-center">
                <Maximize2 className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground max-w-xs">
                  Unable to display the PDF inline. Open it in a new tab instead.
                </p>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm">Open in New Tab</Button>
                </a>
              </div>
            )}

            {/* PDF iframe */}
            {!error && (
              <iframe
                src={`${url}#toolbar=1&navpanes=0`}
                title="Resume"
                className="w-full h-full border-0"
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                allow="fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
