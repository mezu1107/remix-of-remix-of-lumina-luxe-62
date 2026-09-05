import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared helpers for the public REST API that lives under `/api/public/v1/*`.
 * Server-only — never import from a component.
 */

export const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization, content-type, apikey",
  "access-control-max-age": "86400",
};

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS_HEADERS, ...headers },
  });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return json({ ok: false, error: message, details: details ?? undefined }, status);
}

export const preflight = () => new Response(null, { status: 204, headers: CORS_HEADERS });

/** Wraps a handler so an unexpected throw never takes the site down. */
export function safe<T extends (...args: any[]) => Promise<Response>>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (err: any) {
      console.error("[api]", err);
      return apiError(err?.message ?? "Unexpected server error", 500);
    }
  }) as T;
}

function env(name: string, fallbackName?: string) {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function makeClient(accessToken?: string): SupabaseClient {
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: any, init?: any) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
        else if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Anonymous client — row level security applies as a guest. */
export const anonClient = () => makeClient();

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

export type ApiUser = { id: string; email: string | null; client: SupabaseClient; token: string };

/** Resolves the signed-in user from the `Authorization: Bearer <access_token>` header. */
export async function getUser(request: Request): Promise<ApiUser | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const client = makeClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null, client, token };
}

export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) throw new ApiHttpError("Sign in required", 401);
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  const { data, error } = await user.client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new ApiHttpError("Admin access required", 403);
  return user;
}

export class ApiHttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Turns thrown ApiHttpError / Supabase errors into clean JSON responses. */
export function handle(fn: (ctx: { request: Request; params: any }) => Promise<Response>) {
  return async (ctx: { request: Request; params: any }) => {
    try {
      return await fn(ctx);
    } catch (err: any) {
      if (err instanceof ApiHttpError) return apiError(err.message, err.status);
      console.error("[api]", err);
      return apiError(err?.message ?? "Unexpected server error", 500);
    }
  };
}

export function searchParams(request: Request) {
  return new URL(request.url).searchParams;
}

export async function readJson<T = Record<string, any>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiHttpError("A valid JSON body is required", 400);
  }
}

/** Every price in this store is Pakistani Rupees. */
export const CURRENCY = { code: "PKR", symbol: "Rs" } as const;
