'use client'

import { useEffect, useRef, useState } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'

interface ExcalidrawWrapperProps {
  onReady?: (api: any) => void
  onChange?: (elements: any[], appState: any) => void
}

export default function ExcalidrawWrapper({ onReady, onChange }: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (excalidrawAPI && onReady) {
      onReady(excalidrawAPI)
    }
  }, [excalidrawAPI, onReady])

  const handleChange = (elements: any[], appState: any) => {
    if (onChange) {
      onChange(elements, appState)
    }
  }

  return (
    <div className="w-full h-full" ref={wrapperRef}>
      <Excalidraw
        ref={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
      />
    </div>
  )
}
