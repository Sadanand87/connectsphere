"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { MessageCircle, Plus, Send, Search, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  senderPhoto?: string
  receiverId: string
  createdAt: any
}

interface Conversation {
  id: string
  participants: string[]
  participantNames: { [key: string]: string }
  participantPhotos: { [key: string]: string }
  lastMessage?: string
  lastMessageTime?: any
}

interface User {
  uid: string
  displayName: string
  email: string
  photoURL?: string
}

export function MessagesScreen() {
  const { user, userProfile } = useAuth()
  const { toast } = useToast()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Load conversations
  useEffect(() => {
    if (!user) return

    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", user.uid))

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const conversationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[]

      setConversations(conversationsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([])
      return
    }

    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", selectedConversation),
      orderBy("createdAt", "asc"),
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[]

      setMessages(messagesData)
    })

    return () => unsubscribe()
  }, [selectedConversation])

  // Search users
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const usersQuery = query(collection(db, "users"))
      const snapshot = await getDocs(usersQuery)
      const users = snapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() }))
        .filter(
          (u) =>
            u.uid !== user?.uid &&
            (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.email?.toLowerCase().includes(searchQuery.toLowerCase())),
        ) as User[]

      setSearchResults(users)
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search users.",
        variant: "destructive",
      })
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const startConversation = async (otherUser: User) => {
    if (!user) return

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find((conv) => conv.participants.includes(otherUser.uid))

      if (existingConversation) {
        setSelectedConversation(existingConversation.id)
        setShowUserSearch(false)
        return
      }

      // Create new conversation
      const conversationData = {
        participants: [user.uid, otherUser.uid],
        participantNames: {
          [user.uid]: userProfile?.displayName || "User",
          [otherUser.uid]: otherUser.displayName,
        },
        participantPhotos: {
          [user.uid]: userProfile?.photoURL || "",
          [otherUser.uid]: otherUser.photoURL || "",
        },
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "conversations"), conversationData)
      setSelectedConversation(docRef.id)
      setShowUserSearch(false)
      setSearchQuery("")
      setSearchResults([])

      toast({
        title: "Conversation started",
        description: `Started conversation with ${otherUser.displayName}`,
      })
    } catch (error) {
      toast({
        title: "Failed to start conversation",
        description: "An error occurred while starting the conversation.",
        variant: "destructive",
      })
    }
  }

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return

    setSendingMessage(true)
    try {
      const selectedConv = conversations.find((c) => c.id === selectedConversation)
      const receiverId = selectedConv?.participants.find((p) => p !== user.uid)

      await addDoc(collection(db, "messages"), {
        conversationId: selectedConversation,
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: userProfile?.displayName || "User",
        senderPhoto: userProfile?.photoURL || "",
        receiverId,
        createdAt: serverTimestamp(),
      })

      setNewMessage("")
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "An error occurred while sending the message.",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    const otherUserId = conversation.participants.find((p) => p !== user?.uid)
    return {
      id: otherUserId,
      name: otherUserId ? conversation.participantNames[otherUserId] : "Unknown",
      photo: otherUserId ? conversation.participantPhotos[otherUserId] : "",
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

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Messages</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowUserSearch(!showUserSearch)}
                className="gap-2"
                variant={showUserSearch ? "secondary" : "default"}
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {/* User Search */}
            {showUserSearch && (
              <div className="p-4 border-b space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchLoading && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                <ScrollArea className="max-h-32">
                  {searchResults.map((user) => (
                    <div
                      key={user.uid}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => startConversation(user)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}

            {/* Conversations */}
            <ScrollArea className="flex-1">
              {conversations.length > 0 ? (
                <div className="space-y-1 p-2">
                  {conversations.map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation)
                    return (
                      <div
                        key={conversation.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conversation.id ? "bg-primary/10" : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={otherParticipant.photo || "/placeholder.svg"} alt={otherParticipant.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(otherParticipant.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{otherParticipant.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage || "Start a conversation"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start a conversation with someone!</p>
                  <Button onClick={() => setShowUserSearch(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Start Conversation
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={
                        getOtherParticipant(conversations.find((c) => c.id === selectedConversation)!).photo ||
                        "/placeholder.svg"
                      }
                      alt={getOtherParticipant(conversations.find((c) => c.id === selectedConversation)!).name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(getOtherParticipant(conversations.find((c) => c.id === selectedConversation)!).name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {getOtherParticipant(conversations.find((c) => c.id === selectedConversation)!).name}
                    </h3>
                    <p className="text-sm text-muted-foreground">Active now</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === user?.uid
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === user?.uid ? "text-primary-foreground/70" : "text-muted-foreground/70"
                            }`}
                          >
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={sendingMessage}
                  />
                  <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()} className="gap-2">
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a conversation from the sidebar to start messaging.</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
