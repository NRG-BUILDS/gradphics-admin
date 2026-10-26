import { useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, revokeSessionToken } from "@/lib/api";
import { setCredentials, type AppDispatch, type AdminUser } from "@/lib/store";

type SignInResult = {
  user: AdminUser & { emailVerified: boolean };
  accessToken: string;
  refreshToken: string;
};

export function SignInPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<SignInResult>(
        "auth/signin",
        {
          method: "POST",
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
          }),
        },
        false,
      );
      if (result.user.role !== "admin") {
        await revokeSessionToken(result.accessToken);
        throw new Error("This account does not have administrator access.");
      }
      sessionStorage.setItem("gradgram_admin_refresh", result.refreshToken);
      dispatch(setCredentials(result));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sign-in failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[#f7f5f3] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm ring-1 ring-border/80 sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <img alt="Gradphics" className="block w-[132px]" src="/gradphics-logo.png" />
          <div>
            <p className="text-[10px] tracking-[0.12em] text-muted-foreground">
              ADMIN WORKSPACE
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Administrator access</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your verified Gradphics administrator account.
        </p>
        <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-xs font-medium">
            Email address
            <Input
              type="email"
              name="email"
              autoComplete="username"
              required
              className="h-11 rounded-xl"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium">
            Password
            <span className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                className="h-11 rounded-xl pr-12"
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={showPassword ? EyeOffIcon : EyeIcon}
                  size={18}
                  strokeWidth={1.5}
                />
              </button>
            </span>
          </label>
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-[#f5e5e2] px-4 py-3 text-sm text-[#963f34]"
            >
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl"
          >
            {submitting ? "Signing in…" : "Continue to admin"}
          </Button>
        </form>
      </section>
    </main>
  );
}
