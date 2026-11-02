// The problems inside one merged ticket, as separate bugs, counted the desk's way.
// causes.ts places each report by tenant and channel: `parser` or `hint`. A report the desk read as
// a one-day move (desk-notes.json) stays counted where it is filed, as the desk counts it (readAs in
// causes.ts), and is also its own problem: its date moved by a day, not by a day/month swap.
import { groupByCause, readAs, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // For `one-day`: the cause these reports stay filed and counted under.
  filedUnder: Problem[];
  // How many of this group's reports the desk read as a one-day move.
  oneDay: number;
  tenants: string[];
  channels: Record<string, number>;
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

function summary(problem: Problem, rs: Report[]) {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: tally(rs.map((r) => r.channel)),
    taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

// Every report merged into `ticket`, counted once by its cause; the one-day moves listed on top.
export function problemsIn(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: Report[]; groups: ProblemGroup[] } {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const causes = groupByCause(merged, tenantOf);
  const groups: ProblemGroup[] = causes.map((g) => ({
    ...summary(g.cause, g.reports),
    filedUnder: [],
    oneDay: readAs(g, oneDayMove),
  }));
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    groups.push({
      ...summary('one-day', moved),
      filedUnder: causes.filter((g) => readAs(g, oneDayMove) > 0).map((g) => g.cause),
      oneDay: moved.length,
    });
  }
  return { merged, groups };
}
