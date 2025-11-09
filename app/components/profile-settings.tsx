"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Upload, Save, Mail, Phone } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRealtime } from "@/lib/contexts/RealtimeContext"

interface ProfileSettingsProps {
  onProfilePictureUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  profilePicture: string
}

export default function ProfileSettings({ onProfilePictureUpload, profilePicture }: ProfileSettingsProps) {
  const supabase = createClient();
  const { profile, updateProfile: realtimeUpdateProfile } = useRealtime();
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [saving, setSaving] = useState(false)

  // Load profile data from context
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  // Load email from auth
  useEffect(() => {
    async function loadEmail() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || "");
    }
    loadEmail();
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      await realtimeUpdateProfile({
        full_name: fullName,
        username: username,
        phone: phone,
        bio: bio,
      });
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert('Error saving profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="p-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-8">Profile Settings</h2>

      {/* Profile Picture Upload */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-4">Profile Picture</label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center overflow-hidden border-2 border-cyan-400/50">
            {profilePicture ? (
              <img src={profilePicture || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <div>
            <label className="relative cursor-pointer">
              <motion.button
                className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold flex items-center gap-2 hover:bg-cyan-400 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
              >
                <Upload className="w-4 h-4" />
                Change Picture
              </motion.button>
              <input type="file" className="hidden" onChange={onProfilePictureUpload} accept="image/*" />
            </label>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF (max. 2MB)</p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6 mb-8">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold mb-2">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="Enter your full name"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-semibold mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="Enter your username"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="Enter your email"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan-400" />
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="Enter your phone number"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            placeholder="Tell us about yourself"
            rows={4}
          />
        </div>
      </div>

      {/* Save Button */}
      <motion.button
        onClick={saveProfile}
        disabled={saving}
        className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: "0 0 20px rgba(6,182,212,0.4)" }}
        whileHover={{ scale: saving ? 1 : 1.02 }}
        whileTap={{ scale: saving ? 1 : 0.95 }}
      >
        <Save className="w-5 h-5" />
        {saving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </motion.div>
  )
}
