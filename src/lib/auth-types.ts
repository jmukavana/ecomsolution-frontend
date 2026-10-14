export type UserRole = "customer" | "admin";

export interface Me {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  mfa_required: boolean;
  mfa_passed: boolean;
  email_verified_at: string | null;
  has_mfa_factor: boolean;
}

export interface SessionRow {
  id: number;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string | null;
  expires_at: string;
  current: boolean;
}

export interface RequestOtpResponse {
  sent: boolean;
  ttl_minutes: number;
}

export interface VerifyOtpResponse {
  next: "home" | "mfa";
}

export interface MfaStartResponse {
  secret: string;
  otpauth_uri: string;
}

export interface MfaVerifyResponse {
  verified: boolean;
  recovery_codes: string[] | null;
}
