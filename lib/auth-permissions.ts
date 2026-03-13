import { HTTP as Cerbos } from "@cerbos/http";
import { supabase } from "./supabase-client";

// Initialize Cerbos client
// In a real app, CERBOS_URL would be in .env
const cerbosUrl = process.env.CERBOS_URL || "http://localhost:3592";
const cerbos = new Cerbos(cerbosUrl);

export interface AuthUser {
  id: string;
  role: string;
  attr?: Record<string, any>;
}

export interface AuthResource {
  kind: string;
  id: string;
  attr?: Record<string, any>;
}

export async function checkPermission({
  user,
  resource,
  action,
}: {
  user: AuthUser;
  resource: AuthResource;
  action: string;
}) {
  // Mock mode - always allow for now
  // TODO: Implement proper Cerbos integration
  if (user.role === 'admin') return true;
  return true;
}