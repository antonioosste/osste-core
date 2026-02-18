import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id: string;
  name: string | null;
  plan: string | null;
  approved: boolean;
  beta_access_until: string | null;
  created_at: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        // Create profile if doesn't exist
        const newProfile = {
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          plan: 'free'
        };

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        setProfile(created);
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error loading profile",
        description: err instanceof Error ? err.message : "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      return data;
    } catch (err) {
      toast({
        title: "Error updating profile",
        description: err instanceof Error ? err.message : "Failed to update profile",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updatePlan = async (plan: string) => {
    if (!user) return;

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ plan })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(data);
      toast({
        title: "Plan updated",
        description: `Successfully switched to ${plan} plan.`,
      });
      return data;
    } catch (err) {
      toast({
        title: "Error updating plan",
        description: err instanceof Error ? err.message : "Failed to update plan",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updatePlan,
    refetch: fetchProfile,
  };
}
