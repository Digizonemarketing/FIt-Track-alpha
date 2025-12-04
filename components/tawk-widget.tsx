"use client"

import { useEffect } from "react"

export function TawkWidget() {
  useEffect(() => {
    // Avoid injecting the script multiple times
    if (!(window as any).Tawk_API) {
      const script = document.createElement("script")
      script.src = "https://embed.tawk.to/692de9ed6198c31982b7debc/1jbdljifk"
      script.async = true
      script.charset = "UTF-8"
      script.setAttribute("crossorigin", "*")

      script.onload = () => {
        console.log("[Tawk] Script loaded")
        initTawk()
      }

      document.body.appendChild(script)
    } else {
      initTawk()
    }

    function initTawk() {
      const Tawk_API = (window as any).Tawk_API
      if (Tawk_API) {
        Tawk_API.onLoad = () => {
          console.log("[Tawk] Widget loaded successfully")
          // Optionally set user info
          if (typeof Tawk_API.setAttributes === "function") {
            Tawk_API.setAttributes({
              name: "Guest User",
              email: "support@fittrack.com",
            })
          }
        }
        Tawk_API.onStatusChange = (status: string) => {
          console.log("[Tawk] Status changed:", status)
        }
      }
    }
  }, [])

  return null
}

// Function to open chat programmatically
export function openTawkChat() {
  const Tawk_API = (window as any).Tawk_API
  if (Tawk_API) {
    try {
      Tawk_API.toggle()
      console.log("[Tawk] Chat toggled")
    } catch (error) {
      console.error("[Tawk] Error toggling chat:", error)
    }
  } else {
    console.warn("[Tawk] API not available yet")
  }
}
