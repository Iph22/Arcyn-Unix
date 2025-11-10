"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  model: {
    id: string
    name: string
    icon: string
    description: string
    provider: string
    status: "auto" | "connect" | "manual"
  }
  onSuccess?: () => void
}

export default function ConnectionModal({ isOpen, onClose, model, onSuccess }: ConnectionModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const supabase = createClient()

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Please enter an API key")
      setTestStatus("error")
      return
    }

    setTestStatus("testing")
    setErrorMessage("")

    try {
      const response = await fetch("/api/ai-connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: model.provider,
          model_name: model.id,
          api_key: apiKey,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestStatus("success")
      } else {
        setTestStatus("error")
        setErrorMessage(data.error || "Connection test failed")
      }
    } catch (error) {
      setTestStatus("error")
      setErrorMessage("Failed to test connection")
    }
  }

  const handleSaveConnection = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Please enter an API key")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/ai-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: model.provider,
          model_name: model.id,
          api_key: apiKey,
          connection_type: "api_key",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess?.()
        onClose()
        setApiKey("")
        setTestStatus("idle")
      } else {
        // Show specific error from API
        setErrorMessage(data.error || "Failed to save connection")
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setApiKey("")
    setTestStatus("idle")
    setErrorMessage("")
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            style={{ backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto"
              style={{ backdropFilter: "blur(12px)" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{model.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{model.name}</h3>
                    <p className="text-sm text-gray-400">{model.description}</p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Connection Type Info */}
              <div className="mb-6 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-sm text-cyan-400">
                  {model.status === "manual"
                    ? "This model requires an API key to connect"
                    : "Quick connect with OAuth (coming soon) or use API key"}
                </p>
              </div>

              {/* API Key Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-white">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setTestStatus("idle")
                    setErrorMessage("")
                  }}
                  placeholder={`Enter your ${model.provider} API key`}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Your API key is encrypted and stored securely
                </p>
              </div>

              {/* Test Connection Button */}
              <motion.button
                onClick={handleTestConnection}
                disabled={!apiKey.trim() || testStatus === "testing"}
                className="w-full mb-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: !apiKey.trim() || testStatus === "testing" ? 1 : 1.02 }}
                whileTap={{ scale: !apiKey.trim() || testStatus === "testing" ? 1 : 0.98 }}
              >
                {testStatus === "testing" && <Loader2 className="w-4 h-4 animate-spin" />}
                {testStatus === "success" && <CheckCircle className="w-4 h-4 text-green-400" />}
                {testStatus === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
                {testStatus === "testing"
                  ? "Testing..."
                  : testStatus === "success"
                    ? "Connection Successful"
                    : testStatus === "error"
                      ? "Test Failed"
                      : "Test Connection"}
              </motion.button>

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-red-400">{errorMessage}</p>
                </motion.div>
              )}

              {/* Success Message */}
              {testStatus === "success" && (
                <motion.div
                  className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-green-400">
                    Connection test successful! You can now save this connection.
                  </p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveConnection}
                  disabled={!apiKey.trim() || isLoading}
                  className="flex-1 px-4 py-3 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileHover={{ scale: !apiKey.trim() || isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: !apiKey.trim() || isLoading ? 1 : 0.98 }}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? "Saving..." : "Save Connection"}
                </motion.button>
              </div>

              {/* Help Link */}
              <div className="mt-4 text-center">
                <a
                  href={`https://${model.provider}.com/api-keys`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Where do I find my API key?
                </a>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
