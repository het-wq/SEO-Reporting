import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { pageImageUrl } from '@/services/reportsApi';
import { cn } from '@/lib/utils';

export default function PdfPageImage({ reportId, pageNumber, alt, className, aspectClassName = 'aspect-[16/9]' }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const src = reportId ? pageImageUrl(reportId, pageNumber) : null;

  if (!src) return null;

  return (
    <>
      <div
        className={cn('relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 group cursor-zoom-in', aspectClassName, className)}
        onClick={() => !errored && setZoomed(true)}
      >
        {!loaded && !errored && <Skeleton className="absolute inset-0 rounded-lg" />}
        {!errored ? (
          <img
            src={src}
            alt={alt || `Report page ${pageNumber}`}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={cn('w-full h-full object-contain object-top transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            Page preview unavailable
          </div>
        )}
        {loaded && !errored && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors">
            <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
          </div>
        )}
      </div>

      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent onClose={() => setZoomed(false)} className="max-w-5xl p-2">
          <img src={src} alt={alt || `Report page ${pageNumber}`} className="w-full h-auto rounded-md" />
        </DialogContent>
      </Dialog>
    </>
  );
}
