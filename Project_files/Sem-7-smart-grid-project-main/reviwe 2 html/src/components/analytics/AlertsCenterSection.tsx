import React, { useState } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { AlertEvent } from '../../types/power';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Check, 
  Trash2, 
  Filter, 
  Bell, 
  Zap, 
  Clock, 
  Layers
} from 'lucide-react';

export const AlertsCenterSection: React.FC = () => {
  const { alerts, acknowledgeAlert, clearAlerts } = usePowerData();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <section className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Power Quality Alert & Alarm Event Center
            </h2>
            {unacknowledgedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                {unacknowledgedCount} Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time threshold comparator auditing CEA standards and safety limits
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Event Log</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="apple-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="text-slate-500 font-medium">Filter by Severity:</span>
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                severityFilter === sev
                  ? sev === 'CRITICAL' ? 'bg-rose-500 text-white shadow-sm'
                    : sev === 'WARNING' ? 'bg-amber-500 text-white shadow-sm'
                    : sev === 'INFO' ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Showing {filteredAlerts.length} of {alerts.length} logged events
        </div>
      </div>

      {/* Alerts Table */}
      <div className="apple-card p-4 space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-sans text-xs">
            ✓ No active alarms matching selected filter. All monitored parameters are within nominal thresholds.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-100 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Phase</th>
                  <th className="p-3">Parameter / Event</th>
                  <th className="p-3">Measured vs Limit</th>
                  <th className="p-3">Recommended Engineering Action</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAlerts.map(alert => {
                  let sevBg = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (alert.severity === 'WARNING') sevBg = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (alert.severity === 'CRITICAL') sevBg = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';

                  return (
                    <tr key={alert.id} className={`hover:bg-slate-50/80 transition-colors ${!alert.acknowledged ? 'bg-slate-50/40 font-medium' : 'opacity-70'}`}>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sevBg}`}>
                          {alert.severity}
                        </span>
                      </td>

                      <td className="p-3 text-slate-500 font-mono whitespace-nowrap text-[11px]">
                        {alert.timestamp}
                      </td>

                      <td className="p-3 font-semibold">
                        {alert.phase === 'R' ? <span className="text-red-600">Phase R</span> :
                         alert.phase === 'Y' ? <span className="text-amber-600">Phase Y</span> :
                         alert.phase === 'B' ? <span className="text-blue-600">Phase B</span> :
                         <span className="text-slate-700">All Phases</span>}
                      </td>

                      <td className="p-3 text-slate-900 font-semibold">
                        {alert.parameter}
                      </td>

                      <td className="p-3">
                        <span className="text-slate-900 font-bold font-mono">{alert.measuredValue}</span>
                        <span className="text-slate-400 text-[11px] block font-mono">Limit: {alert.limitValue}</span>
                      </td>

                      <td className="p-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                        {alert.recommendedAction}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        {!alert.acknowledged ? (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 text-[11px] font-semibold flex items-center gap-1 ml-auto transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Acknowledge</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Acknowledged</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
