import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

interface ResumeViewerProps {
  url: string;
  label?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * How it works:
 *
 * Cloudinary uploads PDFs as "raw" resources and forces
 * `Content-Disposition: attachment`, which makes the browser download
 * the file even inside an <iframe>.
 *
 * Fix: Cloudinary supports a `fl_inline` delivery flag in the URL path.
 * Inserting it changes the response header to
 * `Content-Disposition: inline`, so the browser's built-in PDF viewer
 * renders the file directly inside the iframe — no fetch(), no proxy,
 * no backend roundtrip needed.
 *
 * Note: the iframe loads the URL as a navigation request, so CORS
 * headers are irrelevant here (CORS only applies to fetch/XHR calls).
 */

/** Insert Cloudinary's fl_inline delivery flag into a raw-upload URL. */
function toInlineUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  // Replace /upload/ with /upload/fl_inline/ only if not already present
  return url.replace(/\/upload\/(?!fl_inline)/, "/upload/fl_inline/");
}

export default function ResumeViewer({ url, label = "View Resume", size = "sm", className }: ResumeViewerProps) {
  const [open, setOpen] = useState(false);

  // Transform once — the iframe navigates directly to this URL
  const inlineUrl = toInlineUrl(url);

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

          {/* fl_inline URL → browser PDF viewer renders inline, no download */}
          <div className="relative flex-1 overflow-hidden bg-muted/30">
            <iframe
              key={inlineUrl}
              src={open ? inlineUrl : undefined}
              title="Resume"
              className="w-full h-full border-0"
              allow="fullscreen"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


