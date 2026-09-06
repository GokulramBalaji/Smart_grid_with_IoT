import { Cpu, FileCode2, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function MatlabExportTab({
  nodeId,
  nodeName,
  hasDevice,
}: {
  nodeId: string;
  nodeName: string;
  hasDevice: boolean;
}) {
  if (!hasDevice) {
    return (
      <EmptyState
        icon={Cpu}
        title="No device attached"
        description="Attach a device so there's measured data to parametrize the exported model."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="size-4 text-accent-blue" />
            <CardTitle>MATLAB / Simulink Export</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          <p className="text-sm leading-relaxed text-foreground-muted">
            Generates a runnable MATLAB (<code>.m</code>) script for <strong>{nodeName}</strong> that initializes
            base-workspace variables — per-phase RMS voltage, current, active/reactive/apparent power, and an
            equivalent series R-L load impedance — computed from this utility&apos;s latest measured readings.
          </p>
          <p className="text-sm leading-relaxed text-foreground-muted">
            The script&apos;s header comments walk through building the matching three single-phase Simscape
            Electrical (Specialized Power Systems) model: one AC Voltage Source and one Series RLC Branch per
            phase, driven by the exported variables. This is real, executable MATLAB source — not a fabricated
            binary <code>.slx</code> file, which can&apos;t be hand-authored reliably.
          </p>
          <a href={`/api/utility-nodes/${nodeId}/matlab-export`} download>
            <Button className="gap-1.5">
              <Download className="size-4" /> Download .m script
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
