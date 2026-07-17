import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      await get().fetchProfile(session.user.id);
    }
    
    set({ session, user: session?.user || null, loading: false });

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, currentSession) => {
      set({ session: currentSession, user: currentSession?.user || null });
      if (currentSession?.user) {
        await get().fetchProfile(currentSession.user.id);
      } else {
        set({ profile: null });
      }
    });
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (data) {
      set({ profile: data });
    } else if (!error) {
      // Profile doesn't exist, let's create a default one
      const user = get().user;
      if (user) {
        const username = user.user_metadata?.username || user.email?.split('@')[0] || `user_${userId.substring(0, 8)}`;
        const displayName = user.user_metadata?.display_name || username;
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: username,
            display_name: displayName
          })
          .select()
          .maybeSingle();
          
        if (newProfile) {
          set({ profile: newProfile });
        } else if (insertError) {
          console.error("Error auto-creating profile:", insertError);
        }
      }
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signUp: async (email, password, username, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
        }
      }
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ session: null, user: null, profile: null });
  },
}));
