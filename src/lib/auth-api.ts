/**
 * Browser-side auth mutations. Use these from event handlers; they hit FastAPI
 * directly (CORS w/ credentials), avoiding a server-fn proxy hop for writes.
 * The `api()` wrapper handles `credentials: 'include'` and mirrors the `csrf`
 * cookie into the `X-CSRF-Token` header automatically.
 */

import { api } from "@/lib/api";
import type {
  Me,
  MfaStartResponse,
  MfaVerifyResponse,
  RequestOtpResponse,
  SessionRow,
  VerifyOtpResponse,
} from "@/lib/auth-types";

export const authApi = {
  requestOtp: (email: string) =>
    api<RequestOtpResponse>("/auth/request-otp", {
      method: "POST",
      body: { email },
    }),

  verifyOtp: (email: string, code: string) =>
    api<VerifyOtpResponse>("/auth/verify-otp", {
      method: "POST",
      body: { email, code },
    }),

  verifyTotp: (code: string) =>
    api<VerifyOtpResponse>("/auth/verify-totp", {
      method: "POST",
      body: { code },
    }),

  logout: () => api<void>("/auth/logout", { method: "POST" }),

  me: () => api<Me>("/auth/me"),

  listSessions: () => api<SessionRow[]>("/me/sessions"),

  revokeSession: (id: number) =>
    api<void>(`/me/sessions/${id}`, { method: "DELETE" }),

  mfaStart: () =>
    api<MfaStartResponse>("/me/security/mfa/start", { method: "POST" }),

  mfaVerify: (code: string) =>
    api<MfaVerifyResponse>("/me/security/mfa/verify", {
      method: "POST",
      body: { code },
    }),

  mfaDisable: () =>
    api<void>("/me/security/mfa", { method: "DELETE" }),
};
