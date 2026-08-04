import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Input } from "../components/ui";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Check your inbox" subtitle="We're almost there.">
        <div className="rounded-lg border border-sync-teal/30 bg-sync-teal/10 px-4 py-3 text-sm text-ink/80">
          We sent a verification link to <strong>{form.email}</strong>. Click it to activate your
          account, then come back and sign in.
        </div>
        <Link to="/login">
          <Button variant="ghost" className="mt-5 w-full justify-center border border-ink/12">
            Back to sign in
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Boards, lists and cards your team can move together, live."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-ink hover:text-sync-teal">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg bg-sync-coral/10 px-3 py-2 text-sm text-sync-coral">{error}</p>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">Full name</label>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Karishma"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">Email</label>
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@team.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">Password</label>
          <Input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
          />
        </div>
        <Button type="submit" variant="accent" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
