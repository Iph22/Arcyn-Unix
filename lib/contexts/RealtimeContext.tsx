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

interface AIConnection {
  id: string;
  user_id: string;
  provider: string;
  model_name: string;
  connection_type: string;
  status: string;
  created_at: string;
}

interface RealtimeContextType {
  profile: Profile | null;
  conversations: Conversation[];
  currentMessages: Message[];
  currentConversationId: string | null;
  userSettings: UserSettings | null;
  connections: AIConnection[];
  setCurrentConversationId: (id: string | null) => void;
  refreshProfile: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshConnections: () => Promise<void>;
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
  const [connections, setConnections] = useState<AIConnection[]>([]);
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

    const connectionsChannel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_connections',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Connection changed:', payload);
          if (payload.eventType === 'INSERT') {
            setConnections(prev => [payload.new as AIConnection, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConnections(prev => prev.map(c => c.id === payload.new.id ? payload.new as AIConnection : c));
          } else if (payload.eventType === 'DELETE') {
            setConnections(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    setChannels([profileChannel, conversationsChannel, connectionsChannel]);

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(connectionsChannel);
    };
  }, [userId]);

  // Setup messages subscription for current conversation
  useEffect(() => {
    if (!currentConversationId) {
      setCurrentMessages([])
      return
    }

    let messagesChannel: RealtimeChannel | null = null

    const setupSubscription = async () => {
      try {
        console.log('📡 Setting up messages subscription for:', currentConversationId)
        
        // Load initial messages first
        await refreshMessages(currentConversationId)

        // Setup real-time subscription
        messagesChannel = supabase
          .channel(`messages-${currentConversationId}`, {
            config: {
              broadcast: { self: true }
            }
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${currentConversationId}` 
            },
            (payload) => {
              console.log('✅ Message received via realtime:', payload.new.id)
              setCurrentMessages(prev => {
                // Check if message already exists (avoid duplicates from optimistic update)
                if (prev.some(m => m.id === payload.new.id)) {
                  console.log('⚠️ Duplicate message, skipping')
                  return prev
                }
                console.log('➕ Adding new message from realtime')
                return [...prev, payload.new as Message]
              })
            }
          )
          .subscribe((status, err) => {
            if (err) {
              console.error('❌ Subscription error:', err)
            } else {
              console.log('📡 Subscription status:', status)
            }
          })

      } catch (error) {
        console.error('❌ Error setting up subscription:', error)
      }
    }

    setupSubscription()

    return () => {
      if (messagesChannel) {
        console.log('🔌 Cleaning up messages subscription')
        supabase.removeChannel(messagesChannel)
      }
    }
  }, [currentConversationId])

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
      
      // Load connections
      await refreshConnections();
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
      console.log('📤 Sending message:', { conversationId, role, content: content.substring(0, 50) })
      
      // Optimistic update - show immediately in UI
      const tempId = `temp-${Date.now()}` 
      const optimisticMessage: Message = {
        id: tempId,
        conversation_id: conversationId,
        role,
        content,
        created_at: new Date().toISOString()
      }
      
      setCurrentMessages(prev => [...prev, optimisticMessage])

      // Insert to database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error inserting message:', error)
        // Remove optimistic message on error
        setCurrentMessages(prev => prev.filter(m => m.id !== tempId))
        throw error
      }

      console.log('✅ Message saved to DB:', data.id)

      // Replace temp message with real one from database
      setCurrentMessages(prev => 
        prev.map(m => m.id === tempId ? data : m)
      )

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

    } catch (error) {
      console.error('❌ Error sending message:', error)
      throw error
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

  async function refreshConnections() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setConnections(data);
    } catch (error) {
      console.error('Error refreshing connections:', error);
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
    connections,
    setCurrentConversationId: (id) => {
      setCurrentConversationId(id);
      if (id) refreshMessages(id);
      else setCurrentMessages([]);
    },
    refreshProfile,
    refreshConversations,
    refreshMessages,
    refreshSettings,
    refreshConnections,
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
