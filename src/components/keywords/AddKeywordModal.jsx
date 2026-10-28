import React, { useState } from 'react';
import { Plus, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AddKeywordModal({ open, onClose, onAdd }) {
  const [keyword, setKeyword] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = (keyword || '').trim();
    if (!clean) {
      setError('Please enter a keyword phrase.');
      return;
    }

    onAdd({
      id: `kw-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      keyword: clean,
      targetUrl: (targetUrl || '').trim(),
      source: 'manual',
    });

    setKeyword('');
    setTargetUrl('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#14532D]" />
            Add Client Target Keyword
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Track this search phrase. It will automatically synchronize with live Google Search Console metrics.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800">
              Keyword Phrase <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. decision intelligence consulting"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (error) setError('');
              }}
              className="text-xs sm:text-sm"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800">
              Target Landing Page URL (Optional)
            </label>
            <Input
              placeholder="https://boulderdecisions.com/services"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="text-xs sm:text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add Keyword
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
