import { SignUp } from "@clerk/clerk-react";

export default function Register() {
  const isClerkConfigured = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!isClerkConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-green-100 text-center">
          <div>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">S</div>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">Sasto Marketplace</h2>
            <p className="mt-2 text-sm text-gray-500">Live Auth Setup Required</p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm text-left">
            <p className="font-semibold mb-1">💡 Developer Notice:</p>
            <p>Clerk authentication is integrated! To log in or sign up with live users, please configure your publishable key in your <code>.env</code> file:</p>
            <pre className="bg-amber-100 p-2 rounded mt-2 text-xs overflow-x-auto text-amber-900">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</pre>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Continue to Marketplace (Guest Mode)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <SignUp routing="path" path="/register" signInUrl="/login" />
    </div>
  );
}
