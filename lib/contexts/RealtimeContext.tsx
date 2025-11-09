"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
}

interface UserSettings {
  id: string;
  user_id: string;
  theme: 'dark' | 'light';
  language: 'en' | 'es' | 'fr';
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  sound_enabled: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface RealtimeContextType {
  profile: Profile | null;
  conversations: Conversation[];
  currentMessages: Message[];
  currentConversationId: string | null;
  userSettings: UserSettings | null;
  setCurrentConversationId: (id: string | null) => void;
  refreshProfile: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  createConversation: (title: string, modelId: string) => Promise<string | null>;
  sendMessage: (conversationId: string, role: string, content: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateSettings: (updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    return () => {
      // Cleanup channels on unmount
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('Profile changed:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Conversation changed:', payload);
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev =>
              prev.map(conv => conv.id === payload.new.id ? payload.new as Conversation : conv)
            );
          } else if (payload.eventType === 'DELETE') {
            setConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    setChannels([profileChannel, conversationsChannel]);

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(conversationsChannel);
    };
  }, [userId]);

  // Setup messages subscription for current conversation
  useEffect(() => {
    if (!currentConversationId) return;

    const messagesChannel = supabase
      .channel(`messages-${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          console.log('Message changed:', payload);
          if (payload.eventType === 'INSERT') {
            setCurrentMessages(prev => [...prev, payload.new as Message]);
          } else if (payload.eventType === 'DELETE') {
            setCurrentMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [currentConversationId]);

  async function loadInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load conversations
      await refreshConversations();
      
      // Load user settings
      await refreshSettings();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  async function refreshProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }

  async function refreshConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (data) setConversations(data);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  }

  async function refreshMessages(conversationId: string) {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) setCurrentMessages(data);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  }

  async function createConversation(title: string, modelId: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title,
          model_id: modelId
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  async function sendMessage(conversationId: string, role: string, content: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content
        });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async function refreshSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setUserSettings(data);
      } else {
        // Create default settings if they don't exist
        const { data: newSettings } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            theme: 'dark',
            language: 'en',
            email_notifications: true,
            push_notifications: true,
            marketing_emails: false,
            sound_enabled: true,
            two_factor_enabled: false
          })
          .select()
          .single();
        
        if (newSettings) setUserSettings(newSettings);
      }
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
  }

  async function updateSettings(updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      // Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user email found');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) throw new Error('Current password is incorrect');

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  const value: RealtimeContextType = {
    profile,
    conversations,
    currentMessages,
    currentConversationId,
    userSettings,
    setCurrentConversationId: (id) => {
      setCurrentConversationId(id);
      if (id) refreshMessages(id);
      else setCurrentMessages([]);
    },
    refreshProfile,
    refreshConversations,
    refreshMessages,
    refreshSettings,
    createConversation,
    sendMessage,
    updateProfile,
    updateSettings,
    changePassword,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
