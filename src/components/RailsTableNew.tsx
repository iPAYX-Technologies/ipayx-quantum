import React from "react";
import type { Rail } from "../types/rails";
import { scoreRail } from "../lib/api";

type Props = {
  rails: Rail[];
};

export default function RailsTableNew({ rails }: Props) {
  const sorted = [...rails]
    .map((r) => ({ ...r, score: scoreRail(r) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
      <table className="min-w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-3">Rail</th>
            <th className="text-left px-4 py-3">Type</th>
            <th className="text-right px-4 py-3">Fee %</th>
            <th className="text-right px-4 py-3">Latency (min)</th>
            <th className="text-right px-4 py-3">Liq</th>
            <th className="text-right px-4 py-3">Vol</th>
            <th className="text-right px-4 py-3">Score</th>
            <th className="text-left px-4 py-3">Provider</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((r) => (
            <tr key={r.name} className="hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3 uppercase text-xs opacity-80">{r.type}</td>
              <td className="px-4 py-3 text-right">{(r.baseFeePct * 100).toFixed(2)}%</td>
              <td className="px-4 py-3 text-right">{r.latencyMin}</td>
              <td className="px-4 py-3 text-right">{r.liq}</td>
              <td className="px-4 py-3 text-right">{(r.vol * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-right">{scoreRail(r).toFixed(3)}</td>
              <td className="px-4 py-3">{r.provider}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="p-4 text-muted-foreground">Aucun rail disponible.</div>
      )}
    </div>
  );
}
