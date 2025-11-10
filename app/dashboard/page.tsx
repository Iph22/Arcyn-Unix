"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useRealtime } from "@/lib/contexts/RealtimeContext"
import { toast } from "sonner"
import {
  Settings,
  Plus,
  Send,
  ChevronDown,
  Home,
  Ear as Gear,
  User,
  Sparkles,
  LogOut,
  Edit3,
  ChevronRight,
  ArrowLeft,
  ChevronLeft,
  CheckCircle,
  Trash2,
  Copy,
  Edit2,
  RefreshCw,
  Check,
} from "lucide-react"
import ProfileSettings from "../components/profile-settings"
import AccountSettings from "../components/account-settings"
import Preferences from "../components/preferences"
import AppSettings from "../components/app-settings"
import ModelsPage from "../components/models-page"
import ConnectionModal from "../components/connection-modal"

interface Conversation {
  id: string
  title: string
  timestamp: string
  model_id?: string
  created_at?: string
  updated_at?: string
}

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
}

interface Model {
  id: string
  name: string
  icon: string
  description: string
  provider: string
  status: "auto" | "connect" | "manual"
  badges?: string[]
}

// Base model definitions (status will be computed dynamically)
const baseModels = [
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    icon: "🔷",
    description: "Google's most capable AI",
    provider: "google",
    defaultStatus: "auto" as const,
    badges: ["Fast", "Accurate"],
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    icon: "🤖",
    description: "OpenAI's most advanced model",
    provider: "openai",
    defaultStatus: "connect" as const,
    badges: ["Powerful", "Creative"],
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    icon: "🧠",
    description: "Most powerful Claude model",
    provider: "anthropic",
    defaultStatus: "manual" as const,
    badges: ["Smart", "Careful"],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "🔍",
    description: "Real-time search AI",
    provider: "perplexity",
    defaultStatus: "connect" as const,
    badges: ["Updated", "Research"],
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: "🌪️",
    description: "Fast and efficient AI",
    provider: "mistral",
    defaultStatus: "auto" as const,
    badges: ["Quick", "Efficient"],
  },
]

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "models", label: "Models", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Gear },
]

export default function ArcynEyeDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const {
    profile,
    conversations: realtimeConversations,
    currentMessages,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    sendMessage: realtimeSendMessage,
    connections,
    refreshConnections,
  } = useRealtime();

  const [showSettings, setShowSettings] = useState(false)
  const [profilePanelOpen, setProfilePanelOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>("gemini")
  const [input, setInput] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [connectionModal, setConnectionModal] = useState<{isOpen: boolean, model: Model | null}>({isOpen: false, model: null})
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editedContent, setEditedContent] = useState("")

  const [currentPage, setCurrentPage] = useState<
    "dashboard" | "profile-settings" | "account-settings" | "preferences" | "app-settings" | "models"
  >("dashboard")
  const [profilePicture, setProfilePicture] = useState<string>("")

  // Close settings modal when profile panel opens
  useEffect(() => {
    if (profilePanelOpen) {
      // Close settings modal when profile opens
      setShowSettings(false)
    }
  }, [profilePanelOpen])

  // Helper function to check if a model is connected
  function getModelStatus(modelId: string, defaultStatus: "auto" | "connect" | "manual"): "auto" | "connect" | "manual" {
    const isConnected = connections.some(c => c.model_name === modelId && c.status === 'active')
    return isConnected ? "auto" : defaultStatus
  }

  // Compute models with dynamic status based on connections
  const models: Model[] = baseModels.map(model => ({
    ...model,
    status: getModelStatus(model.id, model.defaultStatus)
  }))

  // Format conversations with timestamps
  const conversations = realtimeConversations.map(conv => ({
    ...conv,
    timestamp: formatTimestamp(conv.updated_at)
  }));

  // Convert currentMessages to display format
  const messages = currentMessages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }

  const currentModel = models.find((m) => m.id === selectedModel)

  const handleSendMessage = async () => {
    if (!input.trim() || isSendingMessage) return

    const userMessage = input
    setInput("") // Clear input immediately for better UX
    setIsSendingMessage(true)

    try {
      let conversationId = currentConversationId

      // Create conversation if needed
      if (!conversationId) {
        console.log('📝 Creating new conversation...')
        conversationId = await createConversation(
          userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
          selectedModel
        )
        if (conversationId) {
          setCurrentConversationId(conversationId)
        } else {
          throw new Error('Failed to create conversation')
        }
      }

      if (conversationId) {
        // Send user message (optimistic UI will show it immediately)
        console.log('💬 Sending user message...')
        await realtimeSendMessage(conversationId, 'user', userMessage)

        // Get real AI response
        console.log('🤖 Calling AI API...')
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userMessage,
              model: selectedModel,
              provider: currentModel?.provider
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'AI request failed')
          }

          const data = await response.json()
          console.log('✅ AI responded')
          
          // Send AI response
          await realtimeSendMessage(conversationId!, 'assistant', data.response)
        } catch (err: any) {
          console.error('❌ Error getting AI response:', err)
          
          // Show error message to user
          await realtimeSendMessage(
            conversationId!, 
            'assistant', 
            `Error: ${err.message}. Please check your API connection in settings.` 
          )
        }
      }
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const autoConnectedModels = models.filter((m) => m.status === "auto")
  const quickConnectModels = models.filter((m) => m.status === "connect")
  const manualModels = models.filter((m) => m.status === "manual")

  // Delete conversation function
  async function deleteConversation(conversationId: string) {
    if (!confirm('Delete this conversation? This cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
      
      if (error) throw error
      
      // If deleting current conversation, clear it
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null)
      }
      
      toast.success('Conversation deleted')
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }

  // Copy message to clipboard
  function copyToClipboard(text: string, messageIndex: number) {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(messageIndex)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  // Regenerate AI response
  async function regenerateResponse(messageIndex: number) {
    if (!currentConversationId || messageIndex < 1) return
    
    const userMessage = messages[messageIndex - 1]
    if (userMessage.role !== 'user') return
    
    setIsSendingMessage(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model: selectedModel,
          provider: currentModel?.provider
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'AI request failed')
      }

      const data = await response.json()
      
      // Update the assistant message in database
      const assistantMsg = currentMessages[messageIndex]
      if (assistantMsg) {
        await supabase
          .from('messages')
          .update({ content: data.response })
          .eq('id', assistantMsg.id)
      }
      
      toast.success('Response regenerated')
    } catch (err: any) {
      console.error('Error regenerating:', err)
      toast.error('Failed to regenerate response')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicture(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (currentPage !== "dashboard") {
    return (
      <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden font-sans">
        {/* Header with Back Button - Fixed positioning */}
        <motion.div
          className="h-16 px-8 flex items-center justify-between border-b border-white/10 bg-white/5"
          style={{ backdropFilter: "blur(12px)" }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <motion.button
            onClick={() => setCurrentPage("dashboard")}
            className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </motion.button>
          <h1 className="text-xl font-bold text-cyan-400">ARCYN UNIX</h1>
        </motion.div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {currentPage === "profile-settings" && (
            <ProfileSettings onProfilePictureUpload={handleProfilePictureUpload} profilePicture={profilePicture} />
          )}
          {currentPage === "account-settings" && <AccountSettings />}
          {currentPage === "preferences" && <Preferences />}
          {currentPage === "app-settings" && <AppSettings />}
          {currentPage === "models" && <ModelsPage />}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-black text-white flex overflow-hidden font-sans">
      {/* Left Navigation Sidebar - Collapsible */}
      <AnimatePresence>
        {!navCollapsed && (
          <motion.nav
            className="w-20 m-4 rounded-2xl p-4 flex flex-col items-center justify-between bg-white/5 border border-white/10 shadow-lg"
            style={{ backdropFilter: "blur(12px)" }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Navigation Items */}
            <div className="flex flex-col gap-4">
              {navItems.map((item, idx) => {
                const Icon = item.icon
                return (
                  <motion.button
                    key={item.id}
                    className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    onClick={() => {
                      if (item.id === "settings") {
                        setCurrentPage("app-settings")
                      } else if (item.id === "models") {
                        setCurrentPage("models")
                      }
                    }}
                    title={item.label}
                  >
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </motion.button>
                )
              })}
            </div>

            {/* Collapse Button */}
            <motion.button
              onClick={() => setNavCollapsed(true)}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Collapse navigation"
            >
              <ChevronLeft className="w-6 h-6 text-cyan-400" />
            </motion.button>

            {/* Profile Icon at Bottom */}
            <motion.button
              onClick={() => setProfilePanelOpen(!profilePanelOpen)}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 overflow-hidden"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {profilePicture ? (
                <img
                  src={profilePicture || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-cyan-400" />
              )}
            </motion.button>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Collapsed Nav Button */}
      {navCollapsed && (
        <motion.button
          onClick={() => setNavCollapsed(false)}
          className="m-4 w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-lg hover:bg-white/10 transition-all"
          style={{ backdropFilter: "blur(12px)" }}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Expand navigation"
        >
          <ChevronRight className="w-6 h-6 text-cyan-400" />
        </motion.button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Floating Navigation Bar - Adjusted for no overlap */}
        <motion.nav
          className="h-16 mx-4 mt-4 px-6 flex items-center justify-between rounded-full bg-white/5 border border-white/10 shadow-lg"
          style={{ backdropFilter: "blur(12px)" }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <span className="font-bold text-lg">ARCYN UNIX</span>
          </div>

          {/* Model Selector */}
          <motion.button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 rounded-full flex items-center gap-2 hover:scale-105 transition-all bg-white/5 border border-white/10"
            style={{ backdropFilter: "blur(12px)" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{currentModel?.icon}</span>
            <span className="text-sm font-medium">{currentModel?.name}</span>
            <ChevronDown className="w-4 h-4" />
          </motion.button>

          {/* User Profile */}
          <motion.button
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:scale-105 transition-all overflow-hidden"
            style={{ backdropFilter: "blur(12px)" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {profilePicture ? (
              <img src={profilePicture || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </motion.button>
        </motion.nav>

        {/* Main Content */}
        <div className="flex flex-1 gap-4 overflow-hidden px-4 pb-4">
          <AnimatePresence>
            {sidebarOpen ? (
              // Full Sidebar
              <motion.aside
                className="w-80 rounded-2xl p-4 flex flex-col overflow-hidden bg-white/5 border border-white/10 shadow-lg"
                style={{ backdropFilter: "blur(12px)" }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Header with Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-400">Conversations</h3>
                  <motion.button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>

                {/* New Chat Button */}
                <motion.button
                  onClick={() => {
                    setInput("");
                    setCurrentConversationId(null);
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold py-3 rounded-full flex items-center justify-center gap-2 hover:scale-105 transition-all mb-6 shadow-lg"
                  style={{ boxShadow: "0 0 20px rgba(6,182,212,0.4)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-5 h-5" />
                  New Chat
                </motion.button>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-6">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No conversations yet</p>
                  ) : (
                    conversations.map((conv, idx) => (
                      <motion.div
                        key={conv.id}
                        className={`group relative p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-all ${
                          currentConversationId === conv.id ? 'bg-white/10' : ''
                        }`}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                      >
                        <div onClick={() => setCurrentConversationId(conv.id)}>
                          <p className="text-sm font-medium text-white truncate pr-8">{conv.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{conv.timestamp}</p>
                        </div>
                        
                        {/* Delete Button - Shows on hover */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conv.id)
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete conversation"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </motion.button>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Settings Icon */}
                <motion.button
                  onClick={() => setCurrentPage("app-settings")}
                  className="w-full p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Settings</span>
                </motion.button>
              </motion.aside>
            ) : (
              // Collapsed Bubble
              <motion.button
                onClick={() => setSidebarOpen(true)}
                className="w-16 h-20 rounded-full flex flex-col items-center justify-center bg-white/5 border border-white/10 shadow-lg hover:bg-white/10 transition-all"
                style={{ backdropFilter: "blur(12px)" }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Expand sidebar"
              >
                <Plus className="w-6 h-6 text-cyan-400 mb-1" />
                <span className="text-xs text-gray-400">Chat</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <motion.div
              className="flex-1 flex flex-col items-center justify-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {messages.length === 0 ? (
                <>
                  <motion.div
                    className="text-6xl"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3 }}
                  >
                    
                  </motion.div>
                  <h1 className="text-4xl font-bold text-center">Welcome to ARCYN UNIX</h1>
                  <p className="text-lg text-gray-400">Your unified AI interface</p>
                  <p className="text-cyan-400 font-medium">Select a model to start</p>
                </>
              ) : (
                <div className="w-full space-y-4 overflow-y-auto">
                  <AnimatePresence>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`group flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className="relative">
                          <div
                            className={`max-w-xl px-4 py-3 rounded-lg ${
                              msg.role === "user"
                                ? "bg-cyan-500/20 border border-cyan-500/50"
                                : "bg-white/5 border border-white/10"
                            }`}
                            style={msg.role === "user" ? { boxShadow: "0 0 20px rgba(6,182,212,0.3)" } : undefined}
                          >
                            {editingMessageId === idx ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editedContent}
                                  onChange={(e) => setEditedContent(e.target.value)}
                                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white resize-none"
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      // Save edited message logic here
                                      setEditingMessageId(null)
                                    }}
                                    className="px-3 py-1 bg-cyan-500 text-black rounded text-xs font-medium"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-3 py-1 bg-white/10 text-white rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>
                          
                          {/* Message Actions - Show on hover */}
                          {editingMessageId !== idx && (
                            <motion.div
                              className="absolute -top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              initial={{ y: -5 }}
                              animate={{ y: 0 }}
                            >
                              {/* Copy Button */}
                              <motion.button
                                onClick={() => copyToClipboard(msg.content, idx)}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Copy message"
                              >
                                {copiedMessageId === idx ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-white" />
                                )}
                              </motion.button>
                              
                              {/* Edit Button (only for user messages) */}
                              {msg.role === "user" && (
                                <motion.button
                                  onClick={() => {
                                    setEditingMessageId(idx)
                                    setEditedContent(msg.content)
                                  }}
                                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Edit message"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-white" />
                                </motion.button>
                              )}
                              
                              {/* Regenerate Button (only for assistant messages) */}
                              {msg.role === "assistant" && idx > 0 && (
                                <motion.button
                                  onClick={() => regenerateResponse(idx)}
                                  disabled={isSendingMessage}
                                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl disabled:opacity-50"
                                  whileHover={{ scale: isSendingMessage ? 1 : 1.1 }}
                                  whileTap={{ scale: isSendingMessage ? 1 : 0.9 }}
                                  title="Regenerate response"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 text-white ${isSendingMessage ? 'animate-spin' : ''}`} />
                                </motion.button>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Input Bar */}
            <motion.div
              className="mt-4 p-4 rounded-2xl flex gap-3 bg-white/5 border border-white/10 shadow-lg"
              style={{ backdropFilter: "blur(12px)" }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isSendingMessage && handleSendMessage()}
                placeholder={
                  !selectedModel 
                    ? "Select a model first..." 
                    : isSendingMessage 
                      ? "Sending..." 
                      : "Message ARCYN EYE..."
                }
                disabled={!selectedModel || isSendingMessage}
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <motion.button
                onClick={handleSendMessage}
                disabled={isSendingMessage || !input.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isSendingMessage || !input.trim() 
                    ? 'bg-cyan-500/50 cursor-not-allowed' 
                    : 'bg-cyan-500 hover:scale-105'
                }`}
                style={{ boxShadow: "0 0 20px rgba(6,182,212,0.4)" }}
                whileHover={{ scale: isSendingMessage || !input.trim() ? 1 : 1.05 }}
                whileTap={{ scale: isSendingMessage || !input.trim() ? 1 : 0.9 }}
              >
                {isSendingMessage ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-black" />
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-40"
              style={{ backdropFilter: "blur(12px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div
                className="w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-3xl p-8 bg-white/5 border border-white/10 shadow-2xl"
                style={{ backdropFilter: "blur(12px)" }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">Model Management</h2>
                  <motion.button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ✕
                  </motion.button>
                </div>

                {/* Auto-Connected Models */}
                {autoConnectedModels.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-green-400">✓</span>
                      <h3 className="text-lg font-semibold">Auto-Connected Models</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {autoConnectedModels.map((model) => (
                        <ModelCard
                          key={model.id}
                          model={model}
                          onSelect={() => {
                            setSelectedModel(model.id)
                            setShowSettings(false)
                          }}
                          onConnect={() => setConnectionModal({isOpen: true, model})}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Connect Models */}
                {quickConnectModels.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <span>⚡</span>
                      <h3 className="text-lg font-semibold">Quick Connect</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {quickConnectModels.map((model) => (
                        <ModelCard 
                          key={model.id} 
                          model={model} 
                          buttonText="Connect"
                          onConnect={() => setConnectionModal({isOpen: true, model})}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Connection Models */}
                {manualModels.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Gear className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Manual Connection</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {manualModels.map((model) => (
                        <ModelCard 
                          key={model.id} 
                          model={model} 
                          buttonText="Add API Key"
                          onConnect={() => setConnectionModal({isOpen: true, model})}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Connection Modal */}
      {connectionModal.model && (
        <ConnectionModal 
          isOpen={connectionModal.isOpen}
          onClose={() => setConnectionModal({isOpen: false, model: null})}
          model={connectionModal.model}
          onSuccess={() => {
            refreshConnections()
            setConnectionModal({isOpen: false, model: null})
            toast.success('Model connected successfully!')
          }}
        />
      )}

      {/* Profile Settings Panel - Right Side */}
      <AnimatePresence>
        {profilePanelOpen && (
          <motion.aside
            className="w-80 m-4 rounded-2xl p-4 flex flex-col overflow-hidden bg-white/5 border border-white/10 shadow-lg"
            style={{ backdropFilter: "blur(12px)" }}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400">Profile Settings</h3>
              <motion.button
                onClick={() => setProfilePanelOpen(false)}
                className="p-1 rounded hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </motion.button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-black" />
                )}
              </div>
              <div>
                <p className="font-semibold text-white text-lg">{profile?.full_name || 'User'}</p>
                <p className="text-sm text-gray-400">@{profile?.username || 'user'}</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-2 flex-1">
              <motion.button
                onClick={() => {
                  setCurrentPage("profile-settings")
                  setProfilePanelOpen(false)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all text-left"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Edit Profile</span>
              </motion.button>

              <motion.button
                onClick={() => {
                  setCurrentPage("account-settings")
                  setProfilePanelOpen(false)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all text-left"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="w-5 h-5 text-cyan-400" />
                <span>Account Settings</span>
              </motion.button>

              <motion.button
                onClick={() => {
                  setCurrentPage("preferences")
                  setProfilePanelOpen(false)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all text-left"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Gear className="w-5 h-5 text-cyan-400" />
                <span>Preferences</span>
              </motion.button>
            </div>

            {/* Logout Button */}
            <motion.button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/20 transition-all text-left border-t border-white/10 pt-4 text-red-400 mt-4"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </motion.button>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ModelCardProps {
  model: Model
  buttonText?: string
  onSelect?: () => void
  onConnect?: () => void
  isConnected?: boolean
}

function ModelCard({ model, buttonText, onSelect, onConnect, isConnected }: ModelCardProps) {
  const getBadgeColor = (status: string) => {
    switch (status) {
      case "auto":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "connect":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <motion.div
      className="rounded-2xl p-6 flex flex-col items-center text-center hover:scale-105 transition-all cursor-pointer group bg-white/5 border border-white/10 shadow-lg"
      style={{ backdropFilter: "blur(12px)" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
    >
      <div className="text-5xl mb-3">{model.icon}</div>
      <h4 className="font-bold text-white mb-1">{model.name}</h4>
      <p className="text-xs text-gray-400 mb-3">{model.description}</p>

      {model.status === "auto" && (
        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-green-500/20 text-green-400 border-green-500/30 mb-4">
          <CheckCircle className="w-3 h-3" />
          Connected
        </div>
      )}

      {model.badges && (
        <div className="flex gap-2 flex-wrap justify-center mb-4">
          {model.badges.map((badge) => (
            <span key={badge} className="px-2 py-1 rounded text-xs bg-white/5 text-gray-300 border border-white/10">
              {badge}
            </span>
          ))}
        </div>
      )}

      {model.status !== "auto" && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            onConnect?.()
          }}
          className="w-full mt-2 px-3 py-2 rounded-lg bg-cyan-500 text-black font-medium text-sm hover:bg-cyan-400 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          {buttonText || "Connect"}
        </motion.button>
      )}
      
      {model.status === "auto" && onSelect && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.()
          }}
          className="w-full mt-2 px-3 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-all border border-white/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          Select
        </motion.button>
      )}
    </motion.div>
  )
}
