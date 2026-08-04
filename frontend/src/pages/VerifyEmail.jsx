import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api";
import AuthShell from "../components/AuthShell";
import { Button, Spinner } from "../components/ui";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | ok | error

  useEffect(() => {
    api
      .get(`/user/verify/${token}`)
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <AuthShell title="Email verification">
      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-ink/60">
          <Spinner /> Verifying your email…
        </div>
      )}
      {status === "ok" && (
        <div className="space-y-4">
          <p className="rounded-lg bg-sync-teal/10 px-3 py-2 text-sm text-ink/80">
            Your email is verified. You can sign in now.
          </p>
          <Link to="/login">
            <Button variant="accent" className="w-full">
              Go to sign in
            </Button>
          </Link>
        </div>
      )}
      {status === "error" && (
        <p className="rounded-lg bg-sync-coral/10 px-3 py-2 text-sm text-sync-coral">
          That verification link is invalid or already used.
        </p>
      )}
    </AuthShell>
  );
}
