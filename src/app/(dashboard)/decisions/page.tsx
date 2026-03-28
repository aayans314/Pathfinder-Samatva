"use client";

import { useState } from "react";
import { Plus, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { DecisionForm } from "@/components/features/decision-form";
import { DecisionCard } from "@/components/features/decision-card";

export default function DecisionsPage() {
  const decisions = useAppStore((s) => s.decisions);
  const deleteDecision = useAppStore((s) => s.deleteDecision);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Decisions</h1>
          <p className="text-muted-foreground">
            Compare options side-by-side and score them against your goals.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Decision
        </Button>
      </div>

      {decisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16">
          <Scale className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No decisions yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm text-center">
            Create a decision analysis to compare two options against your goals.
            Each option is scored using weighted criteria based on your active goals.
          </p>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Your First Decision
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {decisions.map((d) => (
            <DecisionCard key={d.id} decision={d} onDelete={deleteDecision} />
          ))}
        </div>
      )}

      <DecisionForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
