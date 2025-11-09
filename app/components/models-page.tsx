"use client"
import { motion } from "framer-motion"
import { Ear as Gear } from "lucide-react"

interface Model {
  id: string
  name: string
  icon: string
  description: string
  status: "auto" | "connect" | "manual"
  badges?: string[]
}

const allModels: Model[] = [
  {
    id: "gemini",
    name: "Gemini Pro",
    icon: "🔷",
    description: "Google's most capable AI model for complex tasks",
    status: "auto",
    badges: ["Fast", "Accurate"],
  },
  {
    id: "gpt4",
    name: "GPT-4",
    icon: "🤖",
    description: "OpenAI's most advanced model with exceptional reasoning",
    status: "connect",
    badges: ["Powerful", "Creative"],
  },
  {
    id: "claude",
    name: "Claude 3 Opus",
    icon: "🧠",
    description: "Anthropic's most powerful model for nuanced understanding",
    status: "manual",
    badges: ["Smart", "Careful"],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "🔍",
    description: "Real-time search and reasoning capabilities",
    status: "connect",
    badges: ["Updated", "Research"],
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: "🌪️",
    description: "Fast and efficient open-source AI model",
    status: "auto",
    badges: ["Quick", "Efficient"],
  },
  {
    id: "llama",
    name: "Llama 2",
    icon: "🦙",
    description: "Meta's open-source language model",
    status: "connect",
    badges: ["Open", "Versatile"],
  },
  {
    id: "cohere",
    name: "Cohere Command",
    icon: "⚙️",
    description: "Enterprise-ready language model for production",
    status: "manual",
    badges: ["Enterprise", "Reliable"],
  },
  {
    id: "palm",
    name: "PaLM 2",
    icon: "🌴",
    description: "Google's large language model for diverse tasks",
    status: "auto",
    badges: ["Versatile", "Stable"],
  },
  {
    id: "alpaca",
    name: "Alpaca",
    icon: "🦙",
    description: "Instruction-tuned open model based on LLaMA",
    status: "connect",
    badges: ["Instruction", "Fine-tuned"],
  },
]

export default function ModelsPage() {
  const autoConnectedModels = allModels.filter((m) => m.status === "auto")
  const quickConnectModels = allModels.filter((m) => m.status === "connect")
  const manualModels = allModels.filter((m) => m.status === "manual")

  return (
    <div className="min-h-screen w-full bg-black text-white p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">All Available Models</h1>
          <p className="text-gray-400">Explore and manage all AI models available in ARCYN EYE</p>
        </div>

        {/* Auto-Connected Models */}
        {autoConnectedModels.length > 0 && (
          <motion.div className="mb-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-green-400 text-xl">✓</span>
              <h2 className="text-2xl font-bold">Auto-Connected Models</h2>
              <span className="text-gray-500 text-sm">({autoConnectedModels.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {autoConnectedModels.map((model, idx) => (
                <ModelCard key={model.id} model={model} index={idx} status="connected" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Connect Models */}
        {quickConnectModels.length > 0 && (
          <motion.div className="mb-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-cyan-400 text-xl">⚡</span>
              <h2 className="text-2xl font-bold">Quick Connect</h2>
              <span className="text-gray-500 text-sm">({quickConnectModels.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickConnectModels.map((model, idx) => (
                <ModelCard key={model.id} model={model} index={idx} status="quick-connect" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Manual Connection Models */}
        {manualModels.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2 mb-6">
              <Gear className="w-5 h-5 text-gray-400" />
              <h2 className="text-2xl font-bold">Manual Connection</h2>
              <span className="text-gray-500 text-sm">({manualModels.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {manualModels.map((model, idx) => (
                <ModelCard key={model.id} model={model} index={idx} status="manual" />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

interface ModelCardProps {
  model: Model
  index: number
  status: "connected" | "quick-connect" | "manual"
}

function ModelCard({ model, index, status }: ModelCardProps) {
  const statusConfig = {
    connected: { color: "green", icon: "✓", label: "Connected" },
    "quick-connect": { color: "cyan", icon: "⚡", label: "Quick Connect" },
    manual: { color: "gray", icon: "⚙️", label: "Manual" },
  }

  const config = statusConfig[status]

  return (
    <motion.div
      className="rounded-2xl p-6 flex flex-col h-full bg-white/5 border border-white/10 shadow-lg hover:shadow-xl transition-all hover:scale-105"
      style={{ backdropFilter: "blur(12px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-5xl">{model.icon}</div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            config.color === "green"
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : config.color === "cyan"
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
          }`}
        >
          {config.icon} {config.label}
        </div>
      </div>

      <h3 className="font-bold text-lg text-white mb-2">{model.name}</h3>
      <p className="text-sm text-gray-400 mb-4 flex-1">{model.description}</p>

      {model.badges && (
        <div className="flex gap-2 flex-wrap mb-4">
          {model.badges.map((badge) => (
            <span key={badge} className="px-2 py-1 rounded text-xs bg-white/5 text-gray-300 border border-white/10">
              {badge}
            </span>
          ))}
        </div>
      )}

      <motion.button
        className={`w-full mt-auto px-4 py-2 rounded-lg font-medium text-sm transition-all ${
          status === "connected"
            ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
            : "bg-cyan-500 text-black hover:bg-cyan-400"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
      >
        {status === "connected" ? "Connected" : status === "quick-connect" ? "Connect Now" : "Add API Key"}
      </motion.button>
    </motion.div>
  )
}
