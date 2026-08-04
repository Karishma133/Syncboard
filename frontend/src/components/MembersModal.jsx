import { useEffect, useState } from "react";
import api from "../lib/api";
import Modal from "./Modal";
import { Avatar, Button, Input } from "./ui";

export default function MembersModal({ board, onClose, onChanged }) {
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get(`/boards/${board._id}/members`);
    setMembers(data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const addMember = async (e) => {
    e.preventDefault();
    if (!memberId.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/boards/${board._id}/members`, { memberId: memberId.trim() });
      setMemberId("");
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't add member.");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (id) => {
    await api.delete(`/boards/${board._id}/members/${id}`);
    await load();
    onChanged?.();
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Board members</h2>
          <button onClick={onClose} className="focus-ring rounded p-1 text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>

        <form onSubmit={addMember} className="mb-4 flex gap-2">
          <Input
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="Paste teammate's user ID"
          />
          <Button type="submit" variant="accent" disabled={busy}>
            Add
          </Button>
        </form>
        <p className="mb-4 text-xs text-ink/45">
          Ask your teammate to copy their user ID from their profile / the "me" API response.
        </p>
        {error && <p className="mb-3 text-sm text-sync-coral">{error}</p>}

        <div className="max-h-72 space-y-1 overflow-auto">
          {members.map((m) => (
            <div
              key={m.user._id}
              className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-ink/5"
            >
              <div className="flex items-center gap-2.5">
                <Avatar name={m.user.name} />
                <div>
                  <p className="text-sm text-ink/90">{m.user.name}</p>
                  <p className="text-xs text-ink/45">{m.user.email}</p>
                </div>
              </div>
              {m.role === "owner" ? (
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink/40">
                  owner
                </span>
              ) : (
                <button
                  onClick={() => removeMember(m.user._id)}
                  className="focus-ring text-xs text-sync-coral hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
