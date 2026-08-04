import { useState } from "react";
import api from "../lib/api";
import Modal from "./Modal";
import { Button, Input } from "./ui";

const SWATCHES = ["#17C9B2", "#7C6CF6", "#FF7A59", "#F5B441", "#4C8EF7", "#E5527A"];

export default function LabelsModal({ board, labels, onClose, onChanged }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.post(`/labels/${board._id}`, { name: name.trim(), color });
      setName("");
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (labelId) => {
    await api.delete(`/labels/${board._id}/${labelId}`);
    onChanged();
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Labels</h2>
          <button onClick={onClose} className="focus-ring rounded p-1 text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>

        <div className="mb-4 space-y-1.5">
          {labels.map((l) => (
            <div key={l._id} className="flex items-center justify-between rounded-lg px-1 py-1.5">
              <span
                className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
              <button
                onClick={() => remove(l._id)}
                className="focus-ring text-xs text-sync-coral hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
          {labels.length === 0 && <p className="text-sm text-ink/40">No labels yet.</p>}
        </div>

        <form onSubmit={create} className="space-y-3 border-t border-ink/8 pt-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Label name" />
          <div className="flex items-center gap-2">
            {SWATCHES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full ${color === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <Button type="submit" variant="accent" disabled={busy} className="w-full">
            Create label
          </Button>
        </form>
      </div>
    </Modal>
  );
}
