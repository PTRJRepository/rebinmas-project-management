'use client'

import { Excalidraw } from '@excalidraw/excalidraw'

interface ExcalidrawWrapperProps {
  onReady?: (api: any) => void
  onChange?: (elements: any[], appState: any) => void
}

export default function ExcalidrawWrapper({ onReady, onChange }: ExcalidrawWrapperProps) {
  const handleChange = (elements: readonly any[] | any, appState: any, files: any) => {
    if (onChange) {
      onChange(elements as any[], appState)
    }
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Excalidraw
        onChange={handleChange}
        excalidrawAPI={(api: any) => {
          if (onReady) {
            onReady(api)
          }
        }}
      />
    </div>
  )
}
