import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { toast } from "sonner";



interface GoogleSignInProps {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  className?: string;
  variant?: "button" | "popup";
}

/**
 * Universal Google Sign-In Component
 * Works like Gmail, YouTube, and other Google services
 */
export function GoogleSignIn({ onSuccess, onError, className = "", variant = "button" }: GoogleSignInProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Load Google Sign-In library
    const loadGoogleSignIn = async () => {
      try {
        // Check if google is already loaded
        if ((window as any).google?.accounts?.id) {
          initializeGoogleSignIn();
          return;
        }

        // Load the Google Sign-In script
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleSignIn;
        script.onerror = () => {
          console.error("Failed to load Google Sign-In script");
          onError?.(new Error("Failed to load Google Sign-In"));
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading Google Sign-In:", error);
        onError?.(error);
      }
    };

    const initializeGoogleSignIn = () => {
      if (isInitialized.current || !(window as any).google?.accounts?.id) return;
      isInitialized.current = true;

      try {
        // Initialize Google Sign-In
        (window as any).google.accounts.id.initialize({
          client_id: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "",
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the sign-in button
        if (buttonRef.current && variant === "button") {
          (window as any).google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            size: "large",
            text: "signin_with",
            theme: "outline",
            logo_alignment: "left",
            width: "100%",
          });
        }
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
        onError?.(error);
      }
    };

    loadGoogleSignIn();
  }, [onSuccess, onError, variant]);

  const handleGoogleSignIn = async (response: any) => {
    try {
      if (response.credential) {
        // Send the token to your backend
        const result = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: response.credential,
          }),
        });

        if (!result.ok) {
          throw new Error("Failed to authenticate with Google");
        }

        const data = await result.json();
        toast.success("Successfully signed in with Google!");
        onSuccess?.(data);

        // Redirect to dashboard or home
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Google Sign-In error:", error);
      toast.error("Failed to sign in with Google. Please try again.");
      onError?.(error);
    }
  };

  const handleSignInPopup = () => {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to button if prompt is not available
          (window as any).google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            size: "large",
            text: "signin_with",
          });
        }
      });
    }
  };

  if (variant === "popup") {
    return (
      <Button onClick={handleSignInPopup} className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </Button>
    );
  }

  return (
    <div ref={buttonRef} className={`flex justify-center ${className}`}>
      <div className="flex items-center justify-center">
        <Loader className="w-5 h-5 animate-spin" />
        <span className="ml-2">Loading Google Sign-In...</span>
      </div>
    </div>
  );
}

/**
 * Alternative: Simple Google Sign-In Button
 * Use this for a custom styled button
 */
export function GoogleSignInButton({ onSuccess, onError, className = "" }: Omit<GoogleSignInProps, "variant">) {
  return (
    <GoogleSignIn onSuccess={onSuccess} onError={onError} variant="popup" className={className} />
  );
}
