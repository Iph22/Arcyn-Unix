"use client"

import { motion } from "framer-motion"
import { Moon, Sun, Globe } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"

interface AppSettingsProps {
  theme: "dark" | "light"
  setTheme: Dispatch<SetStateAction<"dark" | "light">>
  language: "en" | "es" | "fr"
  setLanguage: Dispatch<SetStateAction<"en" | "es" | "fr">>
}

export default function AppSettings({ theme, setTheme, language, setLanguage }: AppSettingsProps) {
  return (
    <motion.div
      className="p-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-8">Settings</h2>

      {/* Theme Selection */}
      <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-6">
          {theme === "dark" ? <Moon className="w-5 h-5 text-cyan-400" /> : <Sun className="w-5 h-5 text-cyan-400" />}
          <h3 className="text-xl font-semibold">Theme</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "dark", name: "Dark Mode", icon: Moon },
            { id: "light", name: "Light Mode", icon: Sun },
          ].map((themeOption) => {
            const Icon = themeOption.icon
            return (
              <motion.button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id as "dark" | "light")}
                className={`p-4 rounded-lg flex items-center gap-3 transition-all border ${
                  theme === themeOption.id
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{themeOption.name}</span>
                {theme === themeOption.id && <span className="ml-auto text-sm">✓</span>}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Language Selection */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-semibold">Language</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { id: "en", name: "English", flag: "🇬🇧" },
            { id: "es", name: "Spanish", flag: "🇪🇸" },
            { id: "fr", name: "French", flag: "🇫🇷" },
          ].map((lang) => (
            <motion.button
              key={lang.id}
              onClick={() => setLanguage(lang.id as "en" | "es" | "fr")}
              className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-all border ${
                language === lang.id
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium text-sm">{lang.name}</span>
              {language === lang.id && <span className="text-xs">✓</span>}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
