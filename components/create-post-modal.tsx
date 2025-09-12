"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Plus, ImageIcon, Loader2, X } from "lucide-react"

interface CreatePostModalProps {
  children: React.ReactNode
  onPostCreated?: () => void
}

export function CreatePostModal({ children, onPostCreated }: CreatePostModalProps) {
  const { user, userProfile } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCreatePost = async () => {
    if (!user || (!content.trim() && !selectedImage)) return

    setLoading(true)
    try {
      let imageURL = null

      // Upload image if selected
      if (selectedImage) {
        const imageRef = ref(storage, `post-images/${user.uid}/${Date.now()}-${selectedImage.name}`)
        await uploadBytes(imageRef, selectedImage)
        imageURL = await getDownloadURL(imageRef)
      }

      // Create post document
      await addDoc(collection(db, "posts"), {
        content: content.trim(),
        imageURL,
        authorId: user.uid,
        authorName: userProfile?.displayName || "User",
        authorPhoto: userProfile?.photoURL || null,
        createdAt: serverTimestamp(),
        likes: [],
        comments: [],
      })

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      })

      // Reset form
      setContent("")
      setSelectedImage(null)
      setImagePreview(null)
      setOpen(false)

      // Notify parent component
      onPostCreated?.()
    } catch (error: any) {
      toast({
        title: "Failed to create post",
        description: error.message || "An error occurred while creating your post.",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>Share your thoughts and moments with the community.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Author Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={userProfile?.photoURL || "/placeholder.svg"} alt={userProfile?.displayName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {userProfile?.displayName ? getInitials(userProfile.displayName) : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{userProfile?.displayName || "User"}</p>
              <p className="text-sm text-muted-foreground">Posting to ConnectSphere</p>
            </div>
          </div>

          {/* Content Input */}
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none border-0 p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Preview"
                className="w-full rounded-lg max-h-64 object-cover"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Photo
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={loading || (!content.trim() && !selectedImage)}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
