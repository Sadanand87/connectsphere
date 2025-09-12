"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { Home, Search, MessageCircle, User, LogOut, Plus, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfileScreen } from "./profile-screen"
import { FeedScreen } from "./feed-screen"
import { SearchScreen } from "./search-screen"
import { MessagesScreen } from "./messages-screen"
import { CreatePostModal } from "./create-post-modal"

const navigation = [
  { name: "Home", icon: Home, id: "home" },
  { name: "Search", icon: Search, id: "search" },
  { name: "Messages", icon: MessageCircle, id: "messages" },
  { name: "Profile", icon: User, id: "profile" },
]

export function MainApp() {
  const [activeTab, setActiveTab] = useState("home")
  const { logout, userProfile } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <FeedScreen />
      case "search":
        return <SearchScreen />
      case "messages":
        return <MessagesScreen />
      case "profile":
        return <ProfileScreen />
      default:
        return <FeedScreen />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ConnectSphere
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
              </Button>
              <CreatePostModal>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Plus className="h-4 w-4" />
                  Create Post
                </Button>
              </CreatePostModal>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2 sticky top-24">
              {navigation.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 transition-all duration-200 hover:scale-105",
                    activeTab === item.id &&
                      "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg",
                  )}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Button>
              ))}
            </nav>

            {/* User Profile Card */}
            <div className="mt-8 p-4 bg-gradient-to-br from-card to-card/50 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                  <AvatarImage src={userProfile?.photoURL || "/placeholder.svg"} alt={userProfile?.displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {userProfile?.displayName ? getInitials(userProfile.displayName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{userProfile?.displayName || "User"}</h3>
                  <p className="text-sm text-muted-foreground truncate">{userProfile?.email}</p>
                </div>
              </div>
              {userProfile?.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{userProfile.bio}</p>}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground px-2">Quick Actions</h4>
              <CreatePostModal>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Create Post
                </Button>
              </CreatePostModal>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => setActiveTab("search")}
              >
                <Search className="h-4 w-4" />
                Find Friends
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="animate-in fade-in-50 duration-300">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
