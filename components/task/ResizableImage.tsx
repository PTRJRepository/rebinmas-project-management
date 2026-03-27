'use client'

import React from 'react'
import { Maximize2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResizableImageProps {
    src: string
    alt: string
    title?: string
}

export function ResizableImage({ src, alt, title }: ResizableImageProps) {
    return (
        <div className="flex flex-col gap-2 items-start print:block print:w-auto">
            <div className="relative inline-block group border border-dashed border-transparent hover:border-slate-700 p-2 rounded-xl transition-colors print:border-none print:p-0">
                
                {/* Resizable Container */}
                <div 
                    className="overflow-hidden relative max-w-full print:overflow-visible"
                    style={{ resize: 'horizontal', width: '450px', minWidth: '200px' }}
                >
                    <img 
                        src={src}
                        className="w-full h-auto block rounded-lg border border-white/5 print:rounded-none print:border-gray-300"
                        alt={alt}
                    />
                    
                    {/* Visual Hint for Resizing (Web Only) */}
                    <div className="absolute bottom-2 right-2 p-1.5 bg-sky-500/80 backdrop-blur-md rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity print:hidden shadow-lg">
                        <Maximize2 className="w-3 h-3 text-white" />
                    </div>
                </div>

                <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                         Drag right edge to scale for printing
                    </p>
                </div>
            </div>
            
            {title && (
                <div className="text-sm font-semibold text-slate-300 px-2 print:text-black">
                    {title}
                </div>
            )}
        </div>
    )
}
