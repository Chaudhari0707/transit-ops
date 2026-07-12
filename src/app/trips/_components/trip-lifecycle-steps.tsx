"use client";

import { cn } from "@/lib/utils";
import type { TripStatus } from "@/modules/trips/_types/trip";

const steps: Array<{ key: TripStatus; label: string }> = [
  { key: "draft", label: "Draft" },
  { key: "dispatched", label: "Dispatched" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export function TripLifecycleSteps({ activeStatus }: { activeStatus: TripStatus | "new" }) {
  const current = activeStatus === "new" ? "draft" : activeStatus;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Trip Lifecycle
      </p>
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => {
          const isActive = step.key === current;
          const isPast =
            steps.findIndex((item) => item.key === current) > index && current !== "cancelled";

          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-2.5 rounded-full border",
                  isActive && step.key === "draft" && "border-emerald-400 bg-emerald-400",
                  isActive && step.key === "dispatched" && "border-sky-400 bg-sky-400",
                  isActive &&
                    step.key === "completed" &&
                    "border-muted-foreground bg-muted-foreground",
                  isActive && step.key === "cancelled" && "border-destructive bg-destructive",
                  !isActive && isPast && "border-primary bg-primary",
                  !isActive && !isPast && "border-muted-foreground/40 bg-transparent",
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-sm",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {index < steps.length - 1 ? (
                <span className="mx-1 text-muted-foreground/50" aria-hidden="true">
                  —
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
