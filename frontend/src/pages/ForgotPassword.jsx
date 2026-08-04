import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import AuthShell from "../components/AuthShell";
import { Button, Input } from "../components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/user/forget-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link to="/login" className="font-medium text-ink hover:text-sync-teal">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-lg bg-sync-teal/10 px-3 py-2 text-sm text-ink/80">
          If an account exists for {email}, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-sync-coral/10 px-3 py-2 text-sm text-sync-coral">{error}</p>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@team.com"
            />
          </div>
          <Button type="submit" variant="accent" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
