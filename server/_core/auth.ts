import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response, NextFunction } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import crypto from "crypto";
import { parse as parseCookieHeader } from "cookie";

const CSRF_COOKIE_NAME = "x-csrf-token";

export function validateCsrf(req: Request, res: Response, next: NextFunction) {
  // Only validate for mutation methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Allow tRPC batch calls if they are GET (already handled above)
  // or handle specific routes if needed.

  const cookies = req.headers.cookie ? parseCookieHeader(req.headers.cookie) : {};
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    console.warn(`[Security] CSRF validation failed for ${req.method} ${req.path}`);
    return res.status(403).json({ error: "CSRF validation failed" });
  }

  next();
}

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function buildUserResponse(
  user: any
) {
  return {
    id: user?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

export function registerAuthRoutes(app: Express) {
  /**
   * Supabase Auth Sync
   * Endpoint for frontend to sync Supabase user with backend session.
   */
  app.post("/api/auth/sync", async (req: Request, res: Response) => {
    try {
      const { email, name, id, role } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Sync with local DB
      const lastSignedIn = new Date();
      await upsertUser({
        openId: id || email, // Use Supabase ID or email as unique identifier
        name: name || null,
        email: email,
        loginMethod: "supabase",
        lastSignedIn,
        role: role || "user", // Pass the role from Supabase or default to user
      });

      const user = await getUserByOpenId(id || email);
      
      // Create session token for backend API authentication (JWT)
      const sessionToken = await sdk.createSessionToken(id || email, {
        name: name || email,
        expiresInMs: ONE_YEAR_MS,
      });

      const csrfToken = generateCsrfToken();
      const cookieOptions = getSessionCookieOptions(req);
      
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.cookie(CSRF_COOKIE_NAME, csrfToken, { ...cookieOptions, maxAge: ONE_YEAR_MS, httpOnly: false }); // Client needs to read this

      res.json({ 
        success: true, 
        sessionToken,
        csrfToken,
        user: buildUserResponse(user || {
          openId: id || email,
          name: name || null,
          email: email,
          loginMethod: "supabase",
          lastSignedIn,
        })
      });
    } catch (error) {
      console.error("[Auth] Sync failed:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Logout
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.clearCookie(CSRF_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  /**
   * Get current authenticated user
   */
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ 
        user: buildUserResponse(user)
      });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  /**
   * Establish session cookie from Bearer token
   * Used for web/iframe cross-domain session sharing
   */
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const authHeader = req.headers.authorization || req.headers.Authorization;
      
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      
      const token = authHeader.slice("Bearer ".length).trim();
      const csrfToken = generateCsrfToken();
      const cookieOptions = getSessionCookieOptions(req);
      
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.cookie(CSRF_COOKIE_NAME, csrfToken, { ...cookieOptions, maxAge: ONE_YEAR_MS, httpOnly: false });

      res.json({ success: true, csrfToken, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
