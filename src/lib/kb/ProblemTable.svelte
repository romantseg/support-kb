<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import tickets from '#lib/data/tickets-4471.json';
  import { problemsIn } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';
  import type { Report } from '#lib/kb/causes';

  let { ticket }: { ticket: number } = $props();

  const result = $derived(problemsIn(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const filed = tickets as Record<string, { title: string; url: string }>;
  const list = (r: Record<string, number>) =>
    Object.entries(r)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{result.merged.length}</strong> reports in #{ticket} ·
  <strong>{result.groups.length}</strong> {result.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each result.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>
          <strong>{g.reports.length}</strong>
          {#if g.filedUnder.length}<span class="muted"> · counted under {g.filedUnder.join(', ')}</span>
          {:else if g.oneDay}<span class="muted"> · {g.oneDay} read as one-day</span>{/if}
        </td>
        <td>{g.tenants.length}</td>
        <td class="muted">{list(g.channels)}</td>
        <td class="muted">{list(g.taggedAs)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if filed[g.problem]}
            <a href={filed[g.problem].url}>{filed[g.problem].title}</a>
          {:else}
            <span class="warn">no ticket</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#each result.groups.filter((g) => g.filedUnder.length) as g (g.problem)}
  <p class="muted">
    The {g.reports.length} <code>{g.problem}</code> reports stay counted where they are filed
    (<code>{g.filedUnder.join(', ')}</code>), the way the desk counts them; they are listed again as
    their own problem.
  </p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .warn { color: var(--warn); font-weight: 600; }
</style>
