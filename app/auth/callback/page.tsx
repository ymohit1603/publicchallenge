"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in...");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus("Processing authentication...");
        
        const hashFragment = window.location.hash.substring(1);
        const searchParams = new URLSearchParams(hashFragment || window.location.search.substring(1));
        
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const expiresIn = searchParams.get('expires_in');
        const tokenType = searchParams.get('token_type');
        
        // Check if we have tokens in the URL fragment (implicit flow)
        if (accessToken && refreshToken) {
          setStatus("Setting up your session...");
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error("Session error:", error);
            setError(`Authentication failed: ${error.message}`);
            setTimeout(() => router.replace("/"), 3000);
            return;
          }

          const user = data.user;
          if (user) {
            setStatus("Saving your profile...");
            
            // Save user to database
            const response = await fetch("/api/auth/upsert-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: user.id,
                email: user.email,
                username: user.user_metadata?.user_name || user.user_metadata?.preferred_username,
                name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              console.error("User save error:", errorData);
              setError("Failed to save profile. Please try signing in again.");
              setTimeout(() => router.replace("/"), 3000);
              return;
            }

            const result = await response.json();
            if (result.success) {
              setStatus("Welcome! Redirecting...");
              setTimeout(() => router.replace("/"), 1000);
            } else {
              setError("Profile setup incomplete. Please try again.");
              setTimeout(() => router.replace("/"), 3000);
            }
          } else {
            setError("No user data received. Please try again.");
            setTimeout(() => router.replace("/"), 3000);
          }
        } else {
          // Check if there's an error in the URL
          const errorParam = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          
          if (errorParam) {
            setError(`Authentication failed: ${errorDescription || errorParam}`);
            setTimeout(() => router.replace("/"), 3000);
            return;
          }
          
          // No tokens found, might be a code flow, try to get existing session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !sessionData.session) {
            setError("No authentication data found. Please try signing in again.");
            setTimeout(() => router.replace("/"), 3000);
            return;
          }

          // We have a session, proceed with user creation
          const user = sessionData.session.user;
          setStatus("Saving your profile...");
          
          const response = await fetch("/api/auth/upsert-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              username: user.user_metadata?.user_name || user.user_metadata?.preferred_username,
              name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setStatus("Welcome! Redirecting...");
              setTimeout(() => router.replace("/"), 1000);
            } else {
              setError("Profile setup incomplete. Please try again.");
              setTimeout(() => router.replace("/"), 3000);
            }
          } else {
            setError("Failed to save profile. Please try signing in again.");
            setTimeout(() => router.replace("/"), 3000);
          }
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("Something went wrong. Please try again.");
        setTimeout(() => router.replace("/"), 3000);
      }
    };
    
    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-red-500 text-lg">❌ {error}</div>
            <div className="text-sm text-muted-foreground">Redirecting you back...</div>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <div className="text-lg">{status}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
