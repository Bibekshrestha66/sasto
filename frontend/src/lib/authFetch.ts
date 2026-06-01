export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  let token = "";
  try {
    if ((window as any).Clerk?.session) {
      token = (await (window as any).Clerk.session.getToken()) || "";
    }
  } catch {
    // ignore
  }

  return globalThis.fetch(input, {
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

