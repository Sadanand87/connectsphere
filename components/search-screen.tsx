"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { collection, query, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Search, Users, Hash, TrendingUp, UserPlus, Loader2 } from "lucide-react"

interface User {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  bio?: string
}

export function SearchScreen() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Load all users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"))
        const snapshot = await getDocs(usersQuery)
        const users = snapshot.docs
          .map((doc) => ({ uid: doc.id, ...doc.data() }))
          .filter((u) => u.uid !== user?.uid) as User[]

        setAllUsers(users)
        setSearchResults(users.slice(0, 10)) // Show first 10 users initially
      } catch (error) {
        console.error("Failed to load users:", error)
      } finally {
        setInitialLoading(false)
      }
    }

    if (user) {
      loadUsers()
    }
  }, [user])

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allUsers.slice(0, 10))
      return
    }

    setLoading(true)
    const timeoutId = setTimeout(() => {
      const filtered = allUsers.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.bio?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setSearchResults(filtered)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, allUsers])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-0">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Discover ConnectSphere</h2>
            <p className="text-muted-foreground">Find friends, explore topics, and discover trending content</p>
          </div>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for people, posts, or topics..."
              className="pl-10 bg-background/50 backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold mb-1">People</h3>
            <p className="text-sm text-muted-foreground">Find and connect with friends</p>
            <div className="text-xs text-primary mt-2 font-medium">{allUsers.length} users</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardContent className="p-6 text-center">
            <Hash className="h-8 w-8 text-secondary mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Topics</h3>
            <p className="text-sm text-muted-foreground">Explore trending topics</p>
            <div className="text-xs text-secondary mt-2 font-medium">Coming soon</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-accent/10 to-accent/5">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Trending</h3>
            <p className="text-sm text-muted-foreground">See what's popular</p>
            <div className="text-xs text-accent mt-2 font-medium">Coming soon</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {searchQuery ? `Search Results for "${searchQuery}"` : "Suggested People"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initialLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((user) => (
                <Card key={user.uid} className="hover:shadow-md transition-all duration-200 hover:scale-102">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                        <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{user.displayName}</h3>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        {user.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>}
                        <Button size="sm" className="mt-3 gap-2 bg-transparent" variant="outline">
                          <UserPlus className="h-4 w-4" />
                          Connect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{searchQuery ? "No results found" : "Start searching"}</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search terms or browse suggested people above."
                  : "Use the search bar above to find people, posts, and topics on ConnectSphere."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
