// Login.tsx

import { useState } from "react";
import { useLocation } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Lock, Mail, Loader2, Chrome } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();
  const auth = useAuth();
  
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const googleAuth = (trpc.auth as any).googleSignIn?.useMutation() || { mutateAsync: async () => ({ user: {} }) };

  const redirectUser = (user: any) => {
    
    const redirect = localStorage.getItem("redirectAfterLogin");
    if (redirect) {
      localStorage.removeItem("redirectAfterLogin");
      setLocation(redirect);
      return;
    }

    if (user.role === "super_admin") {
      setLocation("/super-admin/dashboard");
      return;
    }

    if (user.role === "admin") {
      setLocation("/admin/dashboard");
      return;
    }

    setLocation("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("📝 Form submitted");
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password;

      console.log("📞 Calling auth.login via tRPC...");
      const user = await auth.login({ 
        email: normalizedEmail, 
        password: normalizedPassword 
      });
      
      console.log("✅ Login successful", user);
      toast.success("Login Successful!");
      redirectUser(user);
      
    } catch (err) {
      console.error("💥 Error in handleSubmit:", err);
      toast.error("Login failed: " + (err instanceof Error ? err.message : "Invalid credentials"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      const result = await googleAuth.mutateAsync({ token: credentialResponse.credential });
      await auth.refresh();
      toast.success("Signed in with Google!");
      redirectUser(result.user);
    } catch (err) {
      toast.error("Google Sign-In failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border border-green-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-green-100">
              <Shield className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Sign In</CardTitle>
          <CardDescription>Access your Sasto account</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-10 h-11"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  className="pl-10 h-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end mt-1">
                <button 
                  type="button"
                  onClick={() => setLocation("/forgot-password")}
                  className="text-xs text-green-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 h-11 text-base font-semibold transition-all shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
             )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              {(import.meta as any).env.VITE_GOOGLE_CLIENT_ID && (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google Sign-In failed")}
                  useOneTap
                  theme="outline"
                  size="large"
                  width="350"
                  text="continue_with"
                  shape="rectangular"
                />
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button 
                onClick={() => setLocation("/register")}
                className="text-green-600 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}