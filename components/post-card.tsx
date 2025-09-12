"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: string
  text: string
  authorId: string
  authorName: string
  authorPhoto?: string
  createdAt: any
}

interface Post {
  id: string
  content: string
  imageURL?: string
  authorId: string
  authorName: string
  authorPhoto?: string
  createdAt: any
  likes: string[]
  comments: Comment[]
}

interface PostCardProps {
  post: Post
  onUpdate?: () => void
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const { user, userProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [addingComment, setAddingComment] = useState(false)

  const isLiked = user ? post.likes.includes(user.uid) : false

  const handleLike = async () => {
    if (!user) return

    setLoading(true)
    try {
      const postRef = doc(db, "posts", post.id)

      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid),
        })
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid),
        })
      }

      onUpdate?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return

    setAddingComment(true)
    try {
      const comment: Comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        authorId: user.uid,
        authorName: userProfile?.displayName || "User",
        authorPhoto: userProfile?.photoURL || "",
        createdAt: new Date(),
      }

      const postRef = doc(db, "posts", post.id)
      await updateDoc(postRef, {
        comments: arrayUnion(comment),
      })

      setNewComment("")
      onUpdate?.()

      toast({
        title: "Comment added!",
        description: "Your comment has been posted successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      })
    } finally {
      setAddingComment(false)
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const formatCommentDate = (timestamp: any) => {
    if (!timestamp) return "Just now"
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.authorPhoto || "/placeholder.svg"} alt={post.authorName} />
                <AvatarFallback className="bg-primary/10 text-primary">{getInitials(post.authorName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.authorName}</p>
                <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Post Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-sm leading-relaxed">{post.content}</p>
          </div>
        )}

        {/* Post Image */}
        {post.imageURL && (
          <div className="relative">
            <img
              src={post.imageURL || "/placeholder.svg"}
              alt="Post content"
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* Post Actions */}
        <div className="p-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={loading}
                className={`gap-2 ${isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground"}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                {post.likes.length}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="gap-2 text-muted-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                {post.comments.length}
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 space-y-4">
              <Separator />

              {/* Add Comment */}
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={userProfile?.photoURL || "/placeholder.svg"} alt={userProfile?.displayName} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {userProfile?.displayName ? getInitials(userProfile.displayName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    disabled={addingComment}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={addingComment || !newComment.trim()}
                    className="gap-2"
                  >
                    {addingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {post.comments.length > 0 && (
                <div className="space-y-3">
                  {post.comments
                    .sort((a, b) => {
                      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                      return dateB.getTime() - dateA.getTime()
                    })
                    .map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.authorPhoto || "/placeholder.svg"} alt={comment.authorName} />
                          <AvatarFallback className="text-xs bg-secondary/10 text-secondary">
                            {getInitials(comment.authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{comment.authorName}</p>
                              <p className="text-xs text-muted-foreground">{formatCommentDate(comment.createdAt)}</p>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {post.comments.length === 0 && (
                <div className="text-center py-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
