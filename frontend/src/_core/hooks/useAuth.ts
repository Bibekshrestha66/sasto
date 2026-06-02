import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // Get Clerk's session state — this is the source of truth for whether user is logged in
  const { isSignedIn, isLoaded: isClerkLoaded } = useClerkAuth();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // Only run the query when Clerk has loaded and user is signed in
    enabled: isClerkLoaded && !!isSignedIn,
  });

  // Whenever Clerk session changes, invalidate auth.me so it re-fetches with new token
  useEffect(() => {
    if (!isClerkLoaded) return;
    if (isSignedIn) {
      utils.auth.me.invalidate();
    } else {
      // User signed out in Clerk — clear our local cache too
      utils.auth.me.setData(undefined, null as any);
    }
  }, [isSignedIn, isClerkLoaded, utils]);

  const logoutMutation = (trpc.auth as any).logout?.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  }) || { mutateAsync: async () => {}, isPending: false, error: null };

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null as any);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: !isClerkLoaded || meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: isClerkLoaded && !!isSignedIn && Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    isClerkLoaded,
    isSignedIn,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!isClerkLoaded || meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
    isClerkLoaded,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
