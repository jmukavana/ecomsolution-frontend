import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { authQueries } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const loginSearchSchema = z.object({
  next: z.string().optional(),
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/login/")({
  validateSearch: loginSearchSchema,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { email: prefilled, next } = Route.useSearch();
  const [email, setEmail] = useState(prefilled ?? "");

  const mutation = useMutation({
    mutationFn: (value: string) => authApi.requestOtp(value),
    onSuccess: async () => {
      await queryClient.invalidateQueries(authQueries.me());
      void navigate({
        to: "/login/verify",
        search: { email, next },
      });
    },
  });

  return (
    <main className="page-wrap flex justify-center px-4 pb-10 pt-14">
      <Card className="island-shell w-full max-w-md rounded-2xl">
        <CardHeader className="space-y-2">
          <p className="island-kicker">Sign in</p>
          <CardTitle className="display-title text-2xl font-bold text-[var(--sea-ink)]">
            Welcome to Ecomsolution
          </CardTitle>
          <p className="m-0 text-sm text-muted-foreground">
            We'll email you a one-time code — no password needed.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) mutation.mutate(email.trim().toLowerCase());
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mutation.error && (
              <p className="m-0 text-sm text-red-600">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Something went wrong. Try again."}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !email.trim()}
            >
              {mutation.isPending ? "Sending…" : "Send login code"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
