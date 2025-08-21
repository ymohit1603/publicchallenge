"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trophy, Twitter, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateChallengeModal } from "./create-challenge-modal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";

export function Navbar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setUser(data.user);
    };
    getUser();

    // Listen for auth changes (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

const handleSignIn = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error("Error signing in:", error.message);
      toast({
        type: "error",
        title: "Sign In Failed",
        description: `${error.message}`
      });
    }
  } catch (err) {
    console.error("Sign in error:", err);
    toast({
      type: "error",
      title: "Connection Error",
      description: "Failed to initiate sign in. Please try again."
    });
  }
};

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleCreateChallenge = () => {
    if (!user) {
      // not signed in → start login
      return handleSignIn();
    }
    setIsCreateModalOpen(true);
  };

  return (
    <>
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                ChallengeInPublic
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleCreateChallenge}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Challenge
              </Button>

              {!user ? (
                <Button
                  variant="outline"
                  onClick={handleSignIn}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Twitter className="h-4 w-4" />
                  Sign in with Twitter
                </Button>
              ) : (
                <>
                  <span className="text-sm font-medium flex items-center gap-2">
                     {user.user_metadata?.avatar_url && (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full" />
                    )}
                    {user.user_metadata?.user_name}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userId={user?.id}
      />
    </>
  );
}
