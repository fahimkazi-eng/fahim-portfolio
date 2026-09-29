import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers, type AdminUser } from "@/lib/db/schema";

const COOKIE = "kf_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Copy .env.example to .env.local and generate one with `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"`.",
    );
  }
  return new TextEncoder().encode(secret);
}

export type Session = {
  userId: number;
  email: string;
  name: string;
  exp: number;
};

/* -------------------------------------------------------------------------
   Password hashing
   ------------------------------------------------------------------------- */

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/* -------------------------------------------------------------------------
   Session lifecycle
   ------------------------------------------------------------------------- */

export async function createSession(user: AdminUser) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const exp = issuedAt + MAX_AGE_SECONDS;

  const token = await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt(issuedAt)
    .setExpirationTime(exp)
    .sign(getSecretKey());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Reads and verifies the session. Returns null when absent, invalid or expired. */
export async function getSession(): Promise<Session | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub) return null;

    return {
      userId: Number(payload.sub),
      email: String(payload.email ?? ""),
      name: "",
      exp: Number(payload.exp ?? 0),
    };
  } catch {
    return null;
  }
}

/** Verifies credentials against the database. */
export async function authenticate(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase().trim()))
    .limit(1);

  const user = rows[0];
  // Always run a comparison so a missing user and a wrong password take a
  // similar amount of time.
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const ok = await verifyPassword(password, hash);

  if (!user || !ok) return null;
  return user;
}

/**
 * Guard for Server Actions and route handlers. Every mutation calls this
 * directly — proxy.ts is a convenience redirect, never the only check.
 */
export async function requireUser(): Promise<AdminUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORISED");

  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .limit(1);

  const user = rows[0];
  if (!user) throw new Error("UNAUTHORISED");
  return user;
}

export async function touchLastLogin(userId: number) {
  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, userId));
}

export const SESSION_COOKIE = COOKIE;
