import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { authQueries } from "@/server/auth";
import type { MfaStartResponse } from "@/lib/auth-types";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/account/security/mfa")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(authQueries.me());
  },
  component: MfaPage,
});

function MfaPage() {
  const { data: me } = useSuspenseQuery(authQueries.me());
  const queryClient = useQueryClient();
  const [enrol, setEnrol] = useState<MfaStartResponse | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const start = useMutation({
    mutationFn: () => authApi.mfaStart(),
    onSuccess: (data) => {
      setEnrol(data);
      setRecoveryCodes(null);
    },
  });

  const verify = useMutation({
    mutationFn: () => authApi.mfaVerify(code),
    onSuccess: async (data) => {
      setRecoveryCodes(data.recovery_codes ?? []);
      setEnrol(null);
      setCode("");
      await queryClient.invalidateQueries(authQueries.me());
    },
  });

  const disable = useMutation({
    mutationFn: () => authApi.mfaDisable(),
    onSuccess: async () => {
      await queryClient.invalidateQueries(authQueries.me());
    },
  });

  if (!me) return null;

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-1">Security</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          Two-factor authentication
        </h1>
      </header>

      <Card className="island-shell rounded-2xl">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="m-0 text-sm font-semibold">
                Authenticator app{" "}
                {me.has_mfa_factor ? (
                  <Badge variant="default" className="ml-1">Enabled</Badge>
                ) : (
                  <Badge variant="outline" className="ml-1">Not set up</Badge>
                )}
              </p>
              <p className="m-0 text-xs text-muted-foreground">
                Use Google Authenticator, 1Password, or Authy.
              </p>
            </div>
            {me.has_mfa_factor && !me.mfa_required ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => disable.mutate()}
                disabled={disable.isPending}
              >
                Disable
              </Button>
            ) : null}
          </div>

          {!me.has_mfa_factor && !enrol && (
            <>
              <Separator />
              <Button
                onClick={() => start.mutate()}
                disabled={start.isPending}
              >
                {start.isPending ? "Generating…" : "Set up authenticator"}
              </Button>
              {start.error && (
                <p className="m-0 text-sm text-red-600">
                  {start.error instanceof ApiError ? start.error.message : String(start.error)}
                </p>
              )}
            </>
          )}

          {enrol && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="m-0 text-sm font-semibold">
                  1. Scan or paste this secret into your authenticator
                </p>
                <pre className="m-0 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {enrol.secret}
                </pre>
                <p className="m-0 break-all text-xs text-muted-foreground">
                  Or open: <code>{enrol.otpauth_uri}</code>
                </p>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="m-0 text-sm font-semibold">
                  2. Enter the 6-digit code your app shows
                </p>
                <form
                  className="flex flex-wrap items-end gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (code.length === 6) verify.mutate();
                  }}
                >
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {Array.from({ length: 6 }, (_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <Button
                    type="submit"
                    disabled={verify.isPending || code.length !== 6}
                  >
                    {verify.isPending ? "Verifying…" : "Verify & enable"}
                  </Button>
                </form>
                {verify.error && (
                  <p className="m-0 text-sm text-red-600">
                    {verify.error instanceof ApiError
                      ? verify.error.message
                      : String(verify.error)}
                  </p>
                )}
              </div>
            </>
          )}

          {recoveryCodes && (
            <>
              <Separator />
              <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="m-0 font-semibold">
                  Save these recovery codes — shown once!
                </p>
                <p className="m-0 text-xs">
                  Each code logs you in one time if you lose your authenticator. Store them somewhere safe.
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-5">
                  {recoveryCodes.map((c) => (
                    <code key={c} className="rounded bg-white px-2 py-1 text-center">
                      {c}
                    </code>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
