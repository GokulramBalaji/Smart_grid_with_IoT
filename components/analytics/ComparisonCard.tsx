import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatEnergy } from "@/lib/utils";

export function ComparisonCard({
  title,
  currentLabel,
  current,
  previousLabel,
  previous,
  changePercent,
}: {
  title: string;
  currentLabel: string;
  current: number;
  previousLabel: string;
  previous: number;
  changePercent: number;
}) {
  const positive = changePercent >= 0;
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-foreground-muted">{title}</p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-foreground-muted">{currentLabel}</p>
          <p className="text-xl font-semibold text-foreground">{formatEnergy(current)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-foreground-muted">{previousLabel}</p>
          <p className="text-sm font-medium text-foreground-muted">{formatEnergy(previous)}</p>
        </div>
      </div>
      <div
        className={`mt-3 flex items-center gap-1 text-xs font-medium ${positive ? "text-accent-green" : "text-accent-red"}`}
      >
        {positive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
        {positive ? "+" : ""}
        {changePercent}%
      </div>
    </Card>
  );
}
