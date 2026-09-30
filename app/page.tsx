'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { reviewData } from '../src/review/data.ts';
import { reviewPrompt } from '../src/review/prompts.js';

type Data = ReturnType<typeof reviewData>;
type Task = Data['tasks'][number];
type Intent = 'prepare' | 'revise' | 'action' | 'verify';
const intentLabels: Record<Intent, string> = {
  prepare: 'Prepare a draft',
  revise: 'Revise with my notes',
  action: 'Review & take action',
  verify: 'Verify the outcome',
};
function taskState(task: Task) {
  return task.status === 'done'
    ? 'done'
    : task.disposition?.state && task.disposition.state !== 'active'
      ? task.disposition.state
      : task.evidence.some((e) => e.outcome === 'draft')
        ? 'draft saved'
        : 'open';
}
function SafeLink({ value }: { value: string }) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
      throw new Error();
    return (
      <a href={url.href} target="_blank" rel="noreferrer noopener">
        {value} ↗
      </a>
    );
  } catch {
    return <span>{value}</span>;
  }
}
export default function ReviewPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('inbox');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('open');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState('');
  const [intent, setIntent] = useState<Intent>('prepare');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const fragment = window.location.hash.slice(1);
      if (/^[a-f0-9]{64}$/.test(fragment)) {
        sessionStorage.setItem('promotion-review-token', fragment);
        window.history.replaceState(null, '', window.location.pathname);
      }
      const token = sessionStorage.getItem('promotion-review-token') ?? '';
      const response = await fetch('/api/review', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load review data');
      setData(result);
      setNotice('Data refreshed.');
    } catch (err) {
      setError((err as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const tasks = useMemo(
    () =>
      (data?.tasks ?? []).filter((task) => {
        const localState = taskState(task);
        const matchesStatus =
          status === 'all' ||
          (status === 'open'
            ? task.status === 'open' && !['skipped', 'snoozed'].includes(localState)
            : status === 'draft'
              ? task.status === 'open' && task.evidence.some((e) => e.outcome === 'draft')
              : localState === status);
        return (
          matchesStatus &&
          (category === 'all' || task.category === category) &&
          `${task.taskId} ${task.title} ${task.materials}`
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      }),
    [data, status, search, category],
  );
  const task = tasks.find((item) => item.taskId === selected) ?? tasks[0];
  const noteKey = data && task ? `${data.project.id}/${task.taskId}` : '';
  const effectiveIntent = task?.status === 'done' ? 'verify' : intent;
  const prompt =
    data && task ? reviewPrompt(data, task, effectiveIntent, notes[noteKey] ?? '') : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setNotice('Prompt copied. Paste it into your agent to continue.');
    } catch {
      const field = document.getElementById('prompt') as HTMLTextAreaElement | null;
      field?.focus();
      field?.select();
      setNotice('Clipboard unavailable. The prompt is selected below; copy it manually.');
    }
  };
  const valid = data?.classification === 'valid';
  return (
    <>
      <header>
        <div className="brand">
          PA<span>Promotion Agent</span>
        </div>
        <span className="local">REVIEW DESK</span>
        <button onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh data ↻'}
        </button>
      </header>
      <main>
        <section className="intro">
          <div>
            <p className="eyebrow">YOUR PROMOTION DESK</p>
            <h1>
              {data?.project.displayName ??
                (loading ? 'Opening your workspace…' : 'Connect your workspace')}
            </h1>
            <p>
              {data
                ? `${data.tasks.filter((t) => t.status === 'open').length} open tasks · ${data.evidence.filter((e) => e.outcome === 'draft').length} saved draft${data.evidence.filter((e) => e.outcome === 'draft').length === 1 ? '' : 's'}`
                : 'Review tasks, saved results, and your next move.'}
            </p>
          </div>
          <div className="handoff">
            <strong>Review here. Continue in your agent.</strong>
            <p>Choose a task, add your notes, and copy a ready-to-paste prompt.</p>
          </div>
        </section>
        <p id="notice" role="status" aria-live="polite">
          {notice}
        </p>
        {error && (
          <p className="warning" role="alert">
            {error}
          </p>
        )}
        {data?.warnings.map((warning, index) => (
          <p className="warning" key={index}>
            {warning}
          </p>
        ))}
        {data && !valid && (
          <p className="warning">
            The task file is {data.classification}. Prompt actions are disabled until the agent
            fixes the source.
          </p>
        )}
        <nav className="tabs" aria-label="Review views">
          <button aria-pressed={view === 'inbox'} onClick={() => setView('inbox')}>
            Task inbox <span>{data?.tasks.length ?? 0}</span>
          </button>
          <button aria-pressed={view === 'history'} onClick={() => setView('history')}>
            Database & history
          </button>
          <span id="updated">
            {data
              ? `Refreshed ${new Date(data.refreshedAt).toLocaleTimeString()}`
              : 'Waiting for data'}
          </span>
        </nav>
        {view === 'inbox' ? (
          <section className="workspace" aria-busy={loading}>
            <aside aria-label="Task inbox">
              <div className="filters">
                <label htmlFor="search">Find a task</label>
                <input
                  id="search"
                  type="search"
                  placeholder="Search titles, materials, task IDs…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="filter-row">
                  <select
                    aria-label="Filter by status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="open">Open tasks</option>
                    <option value="all">All tasks</option>
                    <option value="draft">With drafts</option>
                    <option value="done">Done</option>
                    <option value="skipped">Skipped</option>
                    <option value="snoozed">Snoozed</option>
                  </select>
                  <select
                    aria-label="Filter by activity"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">All activities</option>
                    {[...new Set(data?.tasks.map((t) => t.category))].sort().map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div id="task-list">
                {tasks.length ? (
                  tasks.map((item) => (
                    <button
                      className="task"
                      key={item.taskId}
                      aria-current={item.taskId === task?.taskId}
                      onClick={() => {
                        setSelected(item.taskId);
                        setNotice('');
                      }}
                    >
                      <span className="meta">
                        {item.taskId}
                        <span>·</span>
                        {item.category}
                        <span className="badge">{item.priority}</span>
                      </span>
                      <strong>{item.title}</strong>
                      <span className="meta">
                        <span className="badge">{taskState(item)}</span>
                        {item.evidence.length > 0 &&
                          `${item.evidence.length} saved record${item.evidence.length === 1 ? '' : 's'}`}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="empty">
                    {loading
                      ? 'Loading tasks…'
                      : data
                        ? 'No tasks match these filters.'
                        : 'Open the private session link from your agent.'}
                  </p>
                )}
              </div>
            </aside>
            <article id="detail" aria-label="Selected task">
              {task && data ? (
                <>
                  <div className="meta">
                    {task.taskId}
                    <span>·</span>
                    {task.category}
                    <span>·</span>
                    {task.filedDate}
                    <span className="badge">{taskState(task)}</span>
                  </div>
                  <h2>{task.title}</h2>
                  {task.actionUrl && <SafeLink value={task.actionUrl} />}
                  <div className="quick-action">
                    <button className="primary" disabled={!valid || loading} onClick={copy}>
                      Copy prompt →
                    </button>
                    <a href="#handoff">Choose next step & add notes ↓</a>
                  </div>
                  {task.disposition?.state !== 'active' && task.disposition && (
                    <p className="warning">
                      {task.disposition.state}: {task.disposition.reason}
                      {task.disposition.until ? ` · until ${task.disposition.until}` : ''}.
                      Reactivate in your agent before acting.
                    </p>
                  )}
                  {task.assignee && <p>Assigned to {task.assignee}</p>}
                  <section className="section">
                    <h3>Prepared materials</h3>
                    <pre>
                      {task.materials ||
                        'No materials recorded yet. Use “Prepare a draft” to get started.'}
                    </pre>
                    {task.agentPrompt && (
                      <details>
                        <summary>Task-specific steps</summary>
                        <pre>{task.agentPrompt}</pre>
                      </details>
                    )}
                  </section>
                  <section className="section">
                    <h3>
                      Saved drafts & evidence <span className="badge">{task.evidence.length}</span>
                    </h3>
                    <p>
                      Evidence accounts describe recorded work. External outcomes still need
                      verification.
                    </p>
                    {task.evidence.length ? (
                      task.evidence.map((e) => (
                        <div className="evidence" key={e.id}>
                          <span className="badge">
                            {e.outcome === 'draft' ? 'Draft' : 'Completion evidence account'}
                          </span>
                          <p className="timestamp">{new Date(e.recordedAt).toLocaleString()}</p>
                          <strong>{e.summary}</strong>
                          <p>
                            <SafeLink value={e.reference} />
                          </p>
                          <p>
                            {e.preview.status}
                            {!e.currentRevision && ' · Task file changed since this record'}
                          </p>
                          {e.preview.text !== null && <pre>{e.preview.text}</pre>}
                          <details>
                            <summary>Record details</summary>
                            <pre>
                              {JSON.stringify(
                                {
                                  path: e.path,
                                  sha256: e.hash,
                                  taskHash: e.taskHash,
                                  referenceSha256: e.referenceSha256,
                                },
                                null,
                                2,
                              )}
                            </pre>
                          </details>
                        </div>
                      ))
                    ) : (
                      <p>
                        No task-linked evidence yet. The agent can save draft records to make
                        results appear here.
                      </p>
                    )}
                  </section>
                  <section id="handoff" className="prompt-box">
                    <h3>Continue in your agent</h3>
                    <p>
                      Choose the next step. The prompt carries the selected task, materials,
                      evidence references and your notes.
                    </p>
                    <label htmlFor="intent">What should the agent do?</label>
                    <select
                      id="intent"
                      value={effectiveIntent}
                      onChange={(e) => setIntent(e.target.value as Intent)}
                    >
                      {Object.entries(intentLabels).map(([value, label]) => (
                        <option
                          key={value}
                          value={value}
                          disabled={task.status === 'done' && value !== 'verify'}
                        >
                          {label}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="notes">Your review notes</label>
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="For example: shorten the opening and focus on the time saved."
                      value={notes[noteKey] ?? ''}
                      onChange={(e) =>
                        setNotes((current) => ({ ...current, [noteKey]: e.target.value }))
                      }
                    />
                    <p>
                      Notes are kept for this page session and included in the prompt. Copy before
                      closing.
                    </p>
                    <button className="primary" disabled={!valid || loading} onClick={copy}>
                      Copy prompt with notes →
                    </button>
                    <p>
                      Paste into Codex, Claude Code, or OpenCode. No action or approval is recorded
                      by copying.
                    </p>
                    <details open>
                      <summary>Prompt preview</summary>
                      <textarea
                        id="prompt"
                        aria-label="Prompt to copy to your agent"
                        readOnly
                        value={prompt}
                      />
                    </details>
                  </section>
                </>
              ) : (
                <p className="empty">Select a task to review its materials.</p>
              )}
            </article>
          </section>
        ) : (
          <section id="history" aria-label="Database and history">
            <h2>Local state, in context</h2>
            <p>
              Registry: <strong>{data?.registry.status ?? 'unavailable'}</strong>
            </p>
            {data?.registry.path && <pre>{data.registry.path}</pre>}
            <p>
              Refresh reads the selected project and database. It does not import tasks or change
              saved state.
            </p>
            {data && (
              <>
                <details>
                  <summary>Project & latest database import</summary>
                  <pre>
                    {JSON.stringify(
                      { project: data.project, lastImport: data.registry.lastImport },
                      null,
                      2,
                    )}
                  </pre>
                </details>
                <h3>Database task snapshot ({data.registry.tasks.length})</h3>
                {data.registry.tasks.length ? (
                  data.registry.tasks.map((t) => (
                    <details key={t.taskId}>
                      <summary>
                        {t.taskId} · {t.title}
                        {t.archived ? ' · archived' : ''}
                      </summary>
                      <pre>{JSON.stringify(t, null, 2)}</pre>
                    </details>
                  ))
                ) : (
                  <p>
                    No saved database tasks for this project. The inbox still reads current project
                    files.
                  </p>
                )}
                <section className="section">
                  <h3>
                    Stored runs, artifacts, reviews & schedules ({data.registry.records.length})
                  </h3>
                  <p>
                    Stored statuses are historical records; this screen does not run jobs or confirm
                    publication.
                  </p>
                  {data.registry.records.length ? (
                    data.registry.records.map((r) => (
                      <div className="record" key={`${r.kind}/${r.id}`}>
                        <span className="badge">{r.kind}</span>
                        <details>
                          <summary>
                            {r.value.summary ??
                              r.value.path ??
                              r.value.output?.summary ??
                              r.value.decision ??
                              r.value.status ??
                              r.id}
                          </summary>
                          <pre>{JSON.stringify(r.value, null, 2)}</pre>
                        </details>
                        {r.preview && (
                          <>
                            <p>{r.preview.status}</p>
                            {r.preview.text !== null && <pre>{r.preview.text}</pre>}
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No stored operational records for this project.</p>
                  )}
                </section>
              </>
            )}
          </section>
        )}
        <footer>
          <span>Files own task content and completion. SQLite adds local state and history.</span>
          <span>Copying a prompt does not execute an action.</span>
        </footer>
      </main>
    </>
  );
}
