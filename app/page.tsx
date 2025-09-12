"use client"

import { useAuth } from "@/lib/auth-context"
import { AuthScreen } from "@/components/auth-screen"
import { MainApp } from "@/components/main-app"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return user ? <MainApp /> : <AuthScreen />
}
