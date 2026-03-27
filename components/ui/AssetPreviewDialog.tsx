'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, ExternalLink, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AssetPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  asset: {
    id: string
    fileName: string
    fileUrl: string
    previewUrl?: string | null
    fileType: string
  } | null
}

export function AssetPreviewDialog({ isOpen, onClose, asset }: AssetPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true)

  if (!asset) return null

  // Treat as image if fileType is 'image' or matches common image extensions
  const isImage = asset.fileType === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(asset.fileName)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose()
        // Reset loading state for next open
        setTimeout(() => setIsLoading(true), 300)
      }
    }}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 bg-slate-950 border-slate-800 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-slate-800 flex flex-row items-center justify-between shrink-0 pr-12">
          <DialogTitle className="text-lg font-bold text-slate-100 truncate">
            {asset.fileName}
          </DialogTitle>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden sm:flex border-slate-700 text-slate-300 hover:text-white" onClick={() => window.open(asset.fileUrl, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" /> Open Original
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex border-slate-700 text-slate-300 hover:text-white" onClick={() => window.location.href = asset.fileUrl}>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-auto custom-scrollbar flex items-center justify-center p-6 bg-slate-900/50">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm z-10">
              <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
            </div>
          )}
          
          {isImage ? (
            <img
              src={asset.previewUrl || asset.fileUrl}
              alt={asset.fileName}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-opacity duration-300"
              style={{ opacity: isLoading ? 0 : 1 }}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          ) : (
            <iframe
              src={asset.previewUrl || asset.fileUrl}
              title={asset.fileName}
              className="w-full h-full border-none rounded-md bg-white shadow-inner"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
