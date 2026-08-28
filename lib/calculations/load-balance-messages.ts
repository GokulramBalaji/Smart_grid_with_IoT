import type { PhaseKey } from "@/types";
import { PHASE_LABELS } from "@/types";
import { average, round, type PhaseTriplet } from "./electrical";

export interface LoadBalanceInsight {
  message: string;
  recommendation: string | null;
}

export function buildLoadBalanceInsight(power: PhaseTriplet, mostPhase: PhaseKey): LoadBalanceInsight {
  const avg = average([power.R, power.Y, power.B]);
  if (avg === 0) {
    return { message: "No load detected on any phase yet.", recommendation: null };
  }

  const mostDeviation = round(((power[mostPhase] - avg) / avg) * 100);
  const otherPhases = (["R", "Y", "B"] as PhaseKey[]).filter((p) => p !== mostPhase);

  if (mostDeviation < 8) {
    return {
      message: "Load is well balanced across all three phases.",
      recommendation: null,
    };
  }

  const message = `${PHASE_LABELS[mostPhase]} is carrying ${mostDeviation}% more load than the average phase load.`;
  const recommendation = `Consider redistributing connected loads from ${PHASE_LABELS[mostPhase]} to ${otherPhases
    .map((p) => PHASE_LABELS[p])
    .join(" or ")}.`;

  return { message, recommendation };
}
