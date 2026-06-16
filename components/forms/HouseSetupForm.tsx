"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { House } from "@/lib/types";
import { saveHouses } from "@/lib/data";
import { num } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shell/PageHeader";

interface Row {
  key: string;
  id?: string;
  name: string;
  capacity: number;
}

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function HouseSetupForm({ houses }: { houses: House[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const tmp = useRef(0);

  const [rows, setRows] = useState<Row[]>(() =>
    houses.map((h) => ({ key: h.id, id: h.id, name: h.name, capacity: h.capacity })),
  );
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addHouse = () => {
    tmp.current += 1;
    setRows((prev) => [
      ...prev,
      { key: `new-${tmp.current}`, name: `House ${prev.length + 1}`, capacity: 16000 },
    ]);
  };

  const removeHouse = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

  const totalCapacity = rows.reduce((s, r) => s + (r.capacity > 0 ? r.capacity : 0), 0);
  const hasRows = rows.length > 0;
  const allValid = hasRows && rows.every((r) => r.name.trim() !== "" && r.capacity > 0);

  async function handleSave() {
    setAttempted(true);
    if (!allValid) {
      toast("Check the houses", { tone: "error", description: "Each house needs a name and a capacity." });
      return;
    }
    setSaving(true);
    const saved = await saveHouses(rows.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity })));
    setRows(saved.map((h) => ({ key: h.id, id: h.id, name: h.name, capacity: h.capacity })));
    setSaving(false);
    toast("Houses saved", { tone: "success", description: `${saved.length} houses · ${num(totalCapacity)} bird capacity.` });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="House setup"
        title="Your houses"
        intro="Add or remove houses and set the bird capacity of each. The total updates as you go."
        action={
          <Button variant="secondary" onClick={() => router.push("/app/houses/allocate")}>
            Allocate a cycle
          </Button>
        }
      />

      <div className="space-y-4">
        {rows.map((r, i) => {
          const nameError = attempted && r.name.trim() === "" ? "Give the house a name." : undefined;
          return (
            <Card key={r.key}>
              <CardBody className="space-y-4 pt-5">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label={`House ${i + 1} name`}
                      value={r.name}
                      error={nameError}
                      onChange={(e) => update(r.key, { name: e.target.value })}
                      placeholder="House name"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHouse(r.key)}
                    aria-label={`Remove ${r.name || `house ${i + 1}`}`}
                    className="mb-[2px] flex size-[52px] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-muted transition-colors duration-[var(--dur-fast)] hover:bg-status-bad-tint hover:text-status-bad"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <Stepper
                  label="Capacity (birds)"
                  value={r.capacity}
                  onChange={(v) => update(r.key, { capacity: v })}
                  min={1}
                  max={100000}
                  step={500}
                  hint="Type a number or use +/−."
                />
              </CardBody>
            </Card>
          );
        })}

        <Button variant="secondary" block onClick={addHouse}>
          + Add a house
        </Button>
      </div>

      <Card>
        <CardBody className="flex items-center justify-between pt-5">
          <div>
            <p className="text-label text-muted">Total capacity</p>
            <p className="mt-0.5 text-data text-[1.5rem] font-medium text-ink">{num(totalCapacity)}</p>
            <p className="text-[0.8125rem] text-muted">{rows.length} houses</p>
          </div>
          <Button size="lg" onClick={handleSave} disabled={saving || !hasRows}>
            Save houses
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
