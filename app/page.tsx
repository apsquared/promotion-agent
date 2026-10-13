'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReviewProject, reviewBoard } from '../src/review/data.ts';
import { completionReport, reviewPrompt, promptTarget, targets } from '../src/review/prompts.js';

type Board = ReturnType<typeof reviewBoard>;
type Task = ReviewProject['tasks'][number] & { project: ReviewProject; key: string };
const all = 'all';
const priorityRank = (priority: string) => {
  const rank = /^P(\d+)$/i.exec(priority.trim());
  return rank ? Number(rank[1]) : 99;
};
/** The board in the URL (`?project=<id>`), so a per-project view survives a reload. */
function scopeFromUrl() {
  return new URLSearchParams(window.location.search).get('project') || all;
}

function parked(task: Task) {
  return task.disposition && task.disposition.state !== 'active' ? task.disposition.state : null;
}
function Completion({ task }: { task: Task }) {
  if (!task.completion)
    return (
      <p className="done-note">
        Done. No completion summary was recorded; ask the promotion agent to record one.
      </p>
    );
  const report = completionReport(task.completion.summary);
  return (
    <section className="result" aria-label="Result">
      <p className="eyebrow">
        Result · recorded {new Date(task.completion.recordedAt).toLocaleDateString()}
      </p>
      {report.text && <p className="description">{report.text}</p>}
      {report.sections.map((section, index) => (
        <div key={index}>
          <h3>{section.label}</h3>
          <p className="description">{section.text || 'Not recorded.'}</p>
        </div>
      ))}
      <p className="meta">
        Evidence: <SafeLink value={task.completion.reference} />
      </p>
    </section>
  );
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
  const [data, setData] = useState<Board | null>(null);
  const [scope, setScope] = useState(all);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'todo' | 'done'>('todo');
  const [selected, setSelected] = useState('');
  const [copied, setCopied] = useState('');
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);
  const detail = useRef<HTMLElement>(null);
  const request = (init: RequestInit = {}) => {
    const fragment = window.location.hash.slice(1);
    if (/^[a-f0-9]{64}$/.test(fragment)) {
      sessionStorage.setItem('promotion-review-token', fragment);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    const token = sessionStorage.getItem('promotion-review-token') ?? '';
    return fetch('/api/review', {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  };
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await request();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load tasks');
      setData(result);
    } catch (err) {
      setError((err as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    setScope(scopeFromUrl());
    const back = () => setScope(scopeFromUrl());
    window.addEventListener('popstate', back);
    void refresh();
    return () => window.removeEventListener('popstate', back);
  }, [refresh]);
  const projects = useMemo(() => data?.projects ?? [], [data]);
  // One project needs no consolidated view; an unknown ?project= falls back to all projects.
  const current =
    projects.length === 1 ? projects[0] : (projects.find((p) => p.project.id === scope) ?? null);
  const counts = (list: ReviewProject[]) =>
    list.reduce((sum, p) => sum + p.tasks.filter((t) => t.status !== 'done').length, 0);
  const lists = useMemo(() => {
    const shown = current ? [current] : projects;
    const tasks: Task[] = shown.flatMap((project) =>
      project.tasks.map((t) => ({ ...t, project, key: `${project.project.id}:${t.taskId}` })),
    );
    const todo = tasks.filter((t) => t.status !== 'done');
    // Active work first; skipped/snoozed sink to the bottom. The consolidated board also ranks by priority.
    todo.sort(
      (a, b) =>
        Number(!!parked(a)) - Number(!!parked(b)) ||
        (current ? 0 : priorityRank(a.priority) - priorityRank(b.priority)),
    );
    return { todo, done: tasks.filter((t) => t.status === 'done') };
  }, [projects, current]);
  const tasks = lists[view];
  const task = tasks.find((t) => t.key === selected) ?? tasks[0];
  const prompt = task && task.status !== 'done' ? reviewPrompt(task.project, task) : null;
  const valid = task?.project.classification === 'valid';
  const canMark =
    valid && !!task.project.registry.path && task.project.registry.status !== 'unavailable';
  const switchTo = (next: string) => {
    setScope(next);
    setSelected('');
    setCopied('');
    setNote('');
    const url = next === all ? window.location.pathname : `?project=${encodeURIComponent(next)}`;
    window.history.pushState(null, '', url);
  };
  const act = async (action: 'complete' | 'skip' | 'resume') => {
    if (!task) return;
    if (action === 'complete' && !window.confirm(`Mark ${task.taskId} complete? This checks its box in the task file.`))
      return;
    setActing(true);
    setError('');
    try {
      const response = await request({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          projectId: task.project.project.id,
          taskId: task.taskId,
          revision: task.project.revision,
          note,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update the task');
      setData(result);
      setNote('');
      // Keep the task in view: skipped tasks sink in To do, completed ones move to Done.
      setSelected(task.key);
      if (action === 'complete') setView('done');
    } catch (err) {
      setError(`${(err as Error).message}. Refresh and try again.`);
    } finally {
      setActing(false);
    }
  };
  const copy = async () => {
    if (!prompt || !task) return;
    try {
      await navigator.clipboard.writeText(prompt.text);
      setCopied(task.key);
    } catch {
      const range = document.createRange();
      const node = document.getElementById('prompt');
      if (node) {
        range.selectNodeContents(node);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
      if (document.execCommand('copy')) setCopied(task.key);
      else setError('Clipboard unavailable. The prompt is selected; copy it manually.');
    }
  };
  const choose = (key: string) => {
    setSelected(key);
    setCopied('');
    setNote('');
    if (window.matchMedia('(max-width: 800px)').matches)
      detail.current?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">Promotion tasks</p>
          <h1>
            {current?.project.displayName ??
              (data ? 'All projects' : loading ? 'Opening workspaces…' : 'Not connected')}
          </h1>
        </div>
        <button onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh ↻'}
        </button>
      </header>
      {projects.length > 1 && (
        <nav className="projects" aria-label="Boards">
          <button aria-pressed={!current} onClick={() => switchTo(all)}>
            All projects <span>{counts(projects)}</span>
          </button>
          {projects.map((p) => (
            <button
              key={p.project.id}
              aria-pressed={current === p}
              onClick={() => switchTo(p.project.id)}
            >
              {p.project.displayName} <span>{counts([p])}</span>
            </button>
          ))}
        </nav>
      )}
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}
      {/* Unreadable workspaces belong on the consolidated board, which a lone workspace's board stands in for. */}
      {(!current || projects.length === 1) &&
        data?.unavailable.map((entry, index) => (
          <p className="warning" key={index}>
            {entry.name}: {entry.error}
          </p>
        ))}
      {(current ? [current] : projects).map((p) => (
        <div key={p.project.id}>
          {p.warnings.map((warning, index) => (
            <p className="warning" key={index}>
              {current ? '' : `${p.project.displayName}: `}
              {warning}
            </p>
          ))}
          {p.classification !== 'valid' && (
            <p className="warning">
              {p.project.displayName}: the task file is {p.classification}. Ask the promotion agent
              to fix it before copying prompts.
            </p>
          )}
        </div>
      ))}
      <section className="board" aria-busy={loading}>
        <aside>
          <nav className="tabs" aria-label="Task lists">
            <button aria-pressed={view === 'todo'} onClick={() => setView('todo')}>
              To do <span>{lists.todo.length}</span>
            </button>
            <button aria-pressed={view === 'done'} onClick={() => setView('done')}>
              Done <span>{lists.done.length}</span>
            </button>
          </nav>
          {tasks.length ? (
            tasks.map((item) => (
              <button
                className="task"
                key={item.key}
                aria-current={item.key === task?.key}
                onClick={() => choose(item.key)}
              >
                <strong>{item.title}</strong>
                <span className="meta">
                  {!current && <span className="chip project">{item.project.project.displayName}</span>}
                  {item.taskId} · {item.priority} · {item.category}
                  {item.status !== 'done' && promptTarget(item) === 'product' && (
                    <span className="chip product">{targets.product.label}</span>
                  )}
                  {parked(item) && <span className="chip muted">{parked(item)}</span>}
                  {item.scheduled && <span className="chip scheduled">{item.scheduled.status}</span>}
                </span>
              </button>
            ))
          ) : (
            <p className="empty">
              {loading
                ? 'Loading tasks…'
                : data && projects.length
                  ? view === 'todo'
                    ? 'Nothing to do. Ask the promotion agent for new tasks.'
                    : 'No finished tasks yet.'
                  : data
                    ? 'No promotion workspaces found. Ask your agent to register a product.'
                    : 'Open the private session link from your agent.'}
            </p>
          )}
        </aside>
        <article ref={detail} aria-label="Selected task">
          {task ? (
            <>
              <p className="meta">
                {!current && `${task.project.project.displayName} · `}
                {task.taskId} · {task.priority} · {task.category} · filed {task.filedDate}
              </p>
              <h2>{task.title}</h2>
              {task.actionUrl && (
                <p>
                  <SafeLink value={task.actionUrl} />
                </p>
              )}
              {parked(task) && (
                <p className="warning">
                  {parked(task)}: {task.disposition!.reason}
                  {task.disposition!.until ? ` · until ${task.disposition!.until}` : ''}
                </p>
              )}
              {task.scheduled && (
                <p className="scheduled-post">
                  <strong>{task.scheduled.status === 'scheduled' ? 'Scheduled' : `Scheduled post ${task.scheduled.status}`}</strong>{' '}
                  · {task.scheduled.adapter === 'post-bridge' ? 'Post Bridge' : 'Manual'}
                  {task.scheduled.channel && ` · ${task.scheduled.channel}`} · {task.scheduled.localTime} (
                  {task.scheduled.scheduledFor.slice(11, 16)} UTC)
                  {task.scheduled.reference && ` · ref ${task.scheduled.reference}`}
                  <br />
                  Recorded by the agent; not verified as published. Changes and cancellations go through the agent.
                </p>
              )}
              <h3>Description</h3>
              <p className="description">{task.materials || 'No description recorded.'}</p>
              {prompt ? (
                <section className={`prompt ${prompt.target}`}>
                  <div className="prompt-head">
                    <div>
                      <p className="eyebrow">Paste into</p>
                      <h3>{targets[prompt.target].label}</h3>
                      <p>{targets[prompt.target].where}</p>
                    </div>
                    <button className="primary" disabled={!valid || loading} onClick={copy}>
                      {copied === task.key ? 'Copied ✓' : 'Copy prompt'}
                    </button>
                  </div>
                  <pre id="prompt">{prompt.text}</pre>
                </section>
              ) : (
                <Completion task={task} />
              )}
              {task.status !== 'done' && (
                <section className="mark" aria-label="Mark this task">
                  <h3>Did it yourself, or not doing it?</h3>
                  {canMark ? (
                    <>
                      {!parked(task) && (
                        <>
                          <label htmlFor="note">
                            Note (optional) — what was done, or why you're skipping it
                          </label>
                          <textarea
                            id="note"
                            rows={2}
                            maxLength={2000}
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                          />
                        </>
                      )}
                      <div className="mark-buttons">
                        {parked(task) ? (
                          <button disabled={acting || loading} onClick={() => act('resume')}>
                            Resume task
                          </button>
                        ) : (
                          <>
                            <button disabled={acting || loading} onClick={() => act('complete')}>
                              Mark complete ✓
                            </button>
                            <button disabled={acting || loading} onClick={() => act('skip')}>
                              Skip
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <p>
                      {valid
                        ? 'To mark tasks here, ask your agent to reopen the review desk with your registry (--database).'
                        : 'Fix the task file before marking tasks.'}
                    </p>
                  )}
                </section>
              )}
            </>
          ) : (
            <p className="empty">Select a task.</p>
          )}
        </article>
      </section>
    </main>
  );
}
