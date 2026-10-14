import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

const verifySearchSchema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
});

export const Route = createFileRoute("/login/verify")({
  validateSearch: verifySearchSchema,
  component: VerifyPage,
});

function VerifyPage() {
  const { email, next } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");

  const mutation = useMutation({
    mutationFn: () => authApi.verifyOtp(email, code),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries(authQueries.me());
      if (data.next === "mfa") {
        void navigate({ to: "/login/mfa", search: { next } });
      } else {
        void navigate({ to: next ?? "/" });
      }
    },
  });

  const resend = useMutation({
    mutationFn: () => authApi.requestOtp(email),
  });

  return (
    <main className="page-wrap flex justify-center px-4 pb-10 pt-14">
      <Card className="island-shell w-full max-w-md rounded-2xl">
        <CardHeader className="space-y-2">
          <p className="island-kicker">Step 2 of 2</p>
          <CardTitle className="display-title text-2xl font-bold text-[var(--sea-ink)]">
            Enter your code
          </CardTitle>
          <p className="m-0 text-sm text-muted-foreground">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length === 6) mutation.mutate();
            }}
          >
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
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
            {mutation.error && (
              <p className="m-0 text-center text-sm text-red-600">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Couldn't verify code."}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || code.length !== 6}
            >
              {mutation.isPending ? "Verifying…" : "Verify"}
            </Button>
            <div className="flex justify-between text-xs text-muted-foreground">
              <Link
                to="/login"
                search={{ email }}
                className="hover:underline"
              >
                Wrong email?
              </Link>
              <button
                type="button"
                onClick={() => resend.mutate()}
                disabled={resend.isPending}
                className="text-[var(--lagoon-deep)] hover:underline disabled:opacity-50"
              >
                {resend.isPending
                  ? "Sending…"
                  : resend.isSuccess
                  ? "Code re-sent ✓"
                  : "Resend code"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
