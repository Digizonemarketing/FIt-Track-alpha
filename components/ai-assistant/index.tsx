"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChatInterface } from "./chat-interface"
import { v4 as uuidv4 } from "uuid"

export function AIAssistant() {
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId] = useState(uuidv4())

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      setUserId(data?.session?.user?.id || null)
    }

    getUser()
  }, [])

  if (!userId) return null

  return <ChatInterface userId={userId} conversationId={conversationId} defaultExpanded={false} />
}
