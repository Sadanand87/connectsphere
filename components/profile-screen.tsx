"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostCard } from "./post-card"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Camera, Loader2, Save, User, Mail, Calendar, Edit3 } from "lucide-react"

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

export function ProfileScreen() {
  const { userProfile, user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || "",
    bio: userProfile?.bio || "",
  })

  // Load user's posts
  useEffect(() => {
    if (!user) return

    const postsQuery = query(collection(db, "posts"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[]

      setUserPosts(postsData)
      setPostsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingImage(true)
    try {
      // Create a reference to the file in Firebase Storage
      const imageRef = ref(storage, `profile-images/${user.uid}/${Date.now()}-${file.name}`)

      // Upload the file
      await uploadBytes(imageRef, file)

      // Get the download URL
      const downloadURL = await getDownloadURL(imageRef)

      // Update user profile in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: downloadURL,
      })

      toast({
        title: "Profile picture updated!",
        description: "Your profile picture has been successfully updated.",
      })

      // Refresh the page to show the new image
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: formData.displayName,
        bio: formData.bio,
      })

      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      })

      setIsEditing(false)
      // Refresh to show updated data
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20"></div>
        <CardContent className="relative pt-0 pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                <AvatarImage src={userProfile?.photoURL || "/placeholder.svg"} alt={userProfile?.displayName} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {userProfile?.displayName ? getInitials(userProfile.displayName) : "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute bottom-2 right-2 rounded-full w-10 h-10 p-0 shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{userProfile?.displayName || "User"}</h1>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
              <p className="text-muted-foreground">{userProfile?.bio || "No bio added yet."}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {userProfile?.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "Recently"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your profile information and bio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Enter your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveProfile} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">{userPosts.length}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-secondary">
              {userPosts.reduce((acc, post) => acc + post.likes.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Likes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-accent">
              {userPosts.reduce((acc, post) => acc + post.comments.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Comments</div>
          </CardContent>
        </Card>
      </div>

      {/* User Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Your Posts</CardTitle>
          <CardDescription>Your recent posts and activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userPosts.length > 0 ? (
            <div className="space-y-6">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">Start sharing your thoughts and moments with the community.</p>
              <Button className="gap-2">
                <Edit3 className="h-4 w-4" />
                Create Your First Post
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
