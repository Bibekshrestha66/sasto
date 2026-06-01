import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { writeDebugLog } from "./debugLog";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
const logTrpcErrors = t.middleware(async (opts: any) => {
  const { ctx, next, path, type } = opts;
  try {
    return await next();
  } catch (error: any) {
    // #region agent log
    writeDebugLog({
      sessionId: "90368c",
      runId: "debug_pre",
      hypothesisId: "H4_trpc_error",
      location: "backend/_core/trpc.ts:logTrpcErrors",
      message: "TRPC middleware caught error",
      data: {
        trpcPath: path,
        trpcType: type,
        errorCode: error?.code ?? null,
        errorMessage: typeof error?.message === "string" ? error.message.slice(0, 200) : null,
        hasUser: Boolean(ctx?.user),
        userRole: ctx?.user?.role || null,
      },
      timestamp: Date.now(),
    });
    // #endregion
    throw error;
  }
});

export const publicProcedure = t.procedure.use(logTrpcErrors);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(logTrpcErrors).use(requireUser);

export const adminProcedure = t.procedure.use(logTrpcErrors).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin')) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
