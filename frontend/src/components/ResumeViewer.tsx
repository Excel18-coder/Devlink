import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";

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
 * Embeds the PDF via Google Docs Viewer so it renders in the browser
 * regardless of Cloudinary's Content-Disposition: attachment header
 * (which would otherwise force a download even inside an iframe).
 */
function googleViewerUrl(pdfUrl: string): string {
  return `https://docs.google.com/gviewer?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
}

export default function ResumeViewer({ url, label = "View Resume", size = "sm", className }: ResumeViewerProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleOpen = () => {
    setLoaded(false);
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
            <div className="flex items-center gap-2 shrink-0">
              {/* Open raw PDF in new tab */}
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </Button>
              </a>
              {/* Force download */}
              <a href={url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </a>
            </div>
          </DialogHeader>

          <div className="relative flex-1 overflow-hidden bg-muted/30">
            {/* Loading spinner — shown until Google Viewer iframe fires onLoad */}
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading resume…</p>
              </div>
            )}

            {/*
              Google Docs Viewer fetches the PDF server-side so
              Content-Disposition: attachment on the Cloudinary URL is
              irrelevant — the viewer streams rendered pages to the iframe.
            */}
            <iframe
              key={url}
              src={googleViewerUrl(url)}
              title="Resume"
              className="w-full h-full border-0"
              onLoad={() => setLoaded(true)}
              allow="fullscreen"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
