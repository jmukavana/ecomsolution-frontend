import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { authQueries } from "@/server/auth";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mfaSearchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/login/mfa")({
  validateSearch: mfaSearchSchema,
  component: MfaPage,
});

function MfaPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");

  const mutation = useMutation({
    mutationFn: () => authApi.verifyTotp(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries(authQueries.me());
      void navigate({ to: next ?? "/" });
    },
  });

  return (
    <main className="page-wrap flex justify-center px-4 pb-10 pt-14">
      <Card className="island-shell w-full max-w-md rounded-2xl">
        <CardHeader className="space-y-2">
          <p className="island-kicker">Two-factor authentication</p>
          <CardTitle className="display-title text-2xl font-bold text-[var(--sea-ink)]">
            Confirm with your authenticator
          </CardTitle>
          <p className="m-0 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app (or a recovery code).
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length >= 6) mutation.mutate();
            }}
          >
            <div className="flex justify-center">
              <InputOTP
                maxLength={10}
                value={code}
                onChange={setCode}
                autoFocus
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="m-0 text-center text-xs text-muted-foreground">
              Lost your device? Paste a recovery code instead — they're longer than 6 chars.
            </p>
            {mutation.error && (
              <p className="m-0 text-center text-sm text-red-600">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Couldn't verify."}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || code.length < 6}
            >
              {mutation.isPending ? "Verifying…" : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
