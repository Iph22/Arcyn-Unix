"use client"

import { motion } from "framer-motion"
import { Lock, Shield, Smartphone, Clock } from "lucide-react"
import { useState } from "react"

export default function AccountSettings() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  return (
    <motion.div
      className="p-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-8">Account Settings</h2>

      {/* Change Password */}
      <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-semibold">Change Password</h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <motion.button
          className="w-full px-6 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          Update Password
        </motion.button>
      </div>

      {/* Two-Factor Authentication */}
      <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-semibold">Two-Factor Authentication</h3>
          </div>
          <motion.button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              twoFactorEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                : "bg-white/5 text-gray-400 border border-white/10"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {twoFactorEnabled ? "Enabled" : "Disabled"}
          </motion.button>
        </div>
        <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
      </div>

      {/* Active Sessions */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-6">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-semibold">Active Sessions</h3>
        </div>

        <div className="space-y-3">
          {[
            { device: "MacBook Pro", browser: "Chrome", lastActive: "5 minutes ago", current: true },
            { device: "iPhone 13", browser: "Safari", lastActive: "2 hours ago", current: false },
            { device: "Windows PC", browser: "Firefox", lastActive: "1 day ago", current: false },
          ].map((session, idx) => (
            <motion.div
              key={idx}
              className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="font-semibold">{session.device}</p>
                  <p className="text-xs text-gray-400">
                    {session.browser} - {session.lastActive}
                  </p>
                </div>
              </div>
              {session.current && (
                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                  Current
                </span>
              )}
              {!session.current && (
                <motion.button
                  className="px-3 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
