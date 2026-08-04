import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import AuthShell from "../components/AuthShell";
import { Button, Input } from "../components/ui";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post(`/user/resetpassword/${token}`, { password });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      footer={
        <Link to="/login" className="font-medium text-ink hover:text-sync-teal">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg bg-sync-coral/10 px-3 py-2 text-sm text-sync-coral">{error}</p>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">New password</label>
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <Button type="submit" variant="accent" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthShell>
  );
}
