"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { DecisionForm } from "@/components/features/decision-form";
import { DecisionCard } from "@/components/features/decision-card";

export default function DecisionsPage() {
  const decisions = useAppStore((s) => s.decisions);
  const deleteDecision = useAppStore((s) => s.deleteDecision);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare options against your goals
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      {decisions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground mb-3">
            No decisions yet. Create one to compare two options side-by-side.
          </p>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create decision
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {decisions.map((d) => (
            <DecisionCard key={d.id} decision={d} onDelete={deleteDecision} />
          ))}
        </div>
      )}

      <DecisionForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
