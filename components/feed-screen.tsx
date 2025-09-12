"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreatePostModal } from "./create-post-modal"
import { PostCard } from "./post-card"
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Plus, TrendingUp, Users, MessageCircle, Loader2 } from "lucide-react"

interface Post {
  id: string
  content: string
  imageURL?: string
  authorId: string
  authorName: string
  authorPhoto?: string
  createdAt: any
  likes: string[]
  comments: any[]
}

export function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set up real-time listener for posts
    const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20))

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[]

      setPosts(postsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handlePostCreated = () => {
    // Posts will be updated automatically via the real-time listener
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Post Card */}
      <Card>
        <CardContent className="p-4">
          <CreatePostModal onPostCreated={handlePostCreated}>
            <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent">
              <Plus className="h-5 w-5" />
              What's on your mind?
            </Button>
          </CreatePostModal>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{posts.length}</div>
            <div className="text-sm text-muted-foreground">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold">{new Set(posts.map((p) => p.authorId)).size}</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold">{posts.reduce((acc, post) => acc + post.likes.length, 0)}</div>
            <div className="text-sm text-muted-foreground">Total Likes</div>
          </CardContent>
        </Card>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} onUpdate={() => {}} />)
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to share something with the community!</p>
              <CreatePostModal onPostCreated={handlePostCreated}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Post
                </Button>
              </CreatePostModal>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
