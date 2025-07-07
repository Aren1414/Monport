'use client'

import { useEffect } from 'react'

export function AddMiniAppPrompt() {
  useEffect(() => {
    const hasShown = localStorage.getItem('miniapp_prompt_shown')
    if (!hasShown && typeof window !== 'undefined' && window.AddMiniApp?.show) {
      window.AddMiniApp.show()
      localStorage.setItem('miniapp_prompt_shown', 'true')
    }
  }, [])

  return null
}
