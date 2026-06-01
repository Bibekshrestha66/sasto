import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

console.log("[DEBUG] import.meta.env:", import.meta.env);
console.log("[DEBUG] VITE_CLERK_PUBLISHABLE_KEY:", import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

let backendBase = (import.meta.env?.VITE_APP_URL as string) || "";
if (typeof window !== "undefined") {
  if (window.location.hostname !== "localhost" && backendBase.includes("localhost")) {
    console.warn("VITE_APP_URL is pointing to localhost in production. Falling back to relative API paths.");
    backendBase = "";
  }
}
const apiUrl = backendBase ? `${backendBase.replace(/\/$/, "")}/api/trpc` : "/api/trpc";

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl,
      transformer: superjson,
      async fetch(input, init) {
        let token = "";
        try {
          if ((window as any).Clerk?.session) {
            token = await (window as any).Clerk.session.getToken() || "";
          }
        } catch (e) {
          console.error("Failed to get Clerk token", e);
        }

        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers: {
            ...(init?.headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      },
    }),
  ],
});

const clerkPublishableKey = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || "";

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      {clerkPublishableKey ? (
        <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      ) : (
        <App />
      )}
    </QueryClientProvider>
  </trpc.Provider>
);
