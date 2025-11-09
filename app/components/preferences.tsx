"use client"

import { motion } from "framer-motion"
import { Bell, Mail, Zap } from "lucide-react"
import { useState } from "react"

export default function Preferences() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  return (
    <motion.div
      className="p-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-8">Preferences</h2>

      {/* Notification Preferences */}
      <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-semibold">Notifications</h3>
        </div>

        <div className="space-y-4">
          {[
            { label: "Email Notifications", state: emailNotifications, setState: setEmailNotifications, icon: Mail },
            { label: "Push Notifications", state: pushNotifications, setState: setPushNotifications, icon: Bell },
            { label: "Marketing Emails", state: marketingEmails, setState: setMarketingEmails, icon: Mail },
            { label: "Sound Effects", state: soundEnabled, setState: setSoundEnabled, icon: Zap },
          ].map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <motion.button
                  onClick={() => item.setState(!item.state)}
                  className={`w-12 h-6 rounded-full transition-all ${item.state ? "bg-cyan-500" : "bg-gray-600"}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white"
                    animate={{ x: item.state ? 24 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Privacy Preferences */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-xl font-semibold mb-4">Privacy</h3>
        <div className="space-y-3">
          <motion.div className="p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer" whileHover={{ x: 4 }}>
            <p className="font-medium">Profile Visibility</p>
            <p className="text-xs text-gray-400 mt-1">Control who can see your profile</p>
          </motion.div>
          <motion.div className="p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer" whileHover={{ x: 4 }}>
            <p className="font-medium">Data Collection</p>
            <p className="text-xs text-gray-400 mt-1">Manage how your data is used</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
