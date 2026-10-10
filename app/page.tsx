'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { reviewData } from '../src/review/data.ts';
import { reviewPrompt, promptTarget, targets } from '../src/review/prompts.js';

type Data = ReturnType<typeof reviewData>;
type Task = Data['tasks'][number];

function parked(task: Task) {
  return task.disposition && task.disposition.state !== 'active' ? task.disposition.state : null;
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
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'todo' | 'done'>('todo');
  const [selected, setSelected] = useState('');
  const [copied, setCopied] = useState('');
  const detail = useRef<HTMLElement>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
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
    void refresh();
  }, [refresh]);
  const lists = useMemo(() => {
    const all = data?.tasks ?? [];
    const todo = all.filter((t) => t.status !== 'done');
    // Active work first; skipped/snoozed sink to the bottom.
    todo.sort((a, b) => Number(!!parked(a)) - Number(!!parked(b)));
    return { todo, done: all.filter((t) => t.status === 'done') };
  }, [data]);
  const tasks = lists[view];
  const task = tasks.find((t) => t.taskId === selected) ?? tasks[0];
  const prompt = data && task && task.status !== 'done' ? reviewPrompt(data, task) : null;
  const valid = data?.classification === 'valid';
  const copy = async () => {
    if (!prompt || !task) return;
    try {
      await navigator.clipboard.writeText(prompt.text);
      setCopied(task.taskId);
    } catch {
      const range = document.createRange();
      const node = document.getElementById('prompt');
      if (node) {
        range.selectNodeContents(node);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
      if (document.execCommand('copy')) setCopied(task.taskId);
      else setError('Clipboard unavailable. The prompt is selected; copy it manually.');
    }
  };
  const choose = (taskId: string) => {
    setSelected(taskId);
    setCopied('');
    if (window.matchMedia('(max-width: 800px)').matches)
      detail.current?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">Promotion tasks</p>
          <h1>
            {data?.project.displayName ?? (loading ? 'Opening workspace…' : 'Not connected')}
          </h1>
        </div>
        <button onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh ↻'}
        </button>
      </header>
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
          The task file is {data.classification}. Ask the promotion agent to fix it before copying
          prompts.
        </p>
      )}
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
                key={item.taskId}
                aria-current={item.taskId === task?.taskId}
                onClick={() => choose(item.taskId)}
              >
                <strong>{item.title}</strong>
                <span className="meta">
                  {item.taskId} · {item.priority} · {item.category}
                  {item.status !== 'done' && promptTarget(item) === 'product' && (
                    <span className="chip product">{targets.product.label}</span>
                  )}
                  {parked(item) && <span className="chip muted">{parked(item)}</span>}
                </span>
              </button>
            ))
          ) : (
            <p className="empty">
              {loading
                ? 'Loading tasks…'
                : data
                  ? view === 'todo'
                    ? 'Nothing to do. Ask the promotion agent for new tasks.'
                    : 'No finished tasks yet.'
                  : 'Open the private session link from your agent.'}
            </p>
          )}
        </aside>
        <article ref={detail} aria-label="Selected task">
          {task && data ? (
            <>
              <p className="meta">
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
                      {copied === task.taskId ? 'Copied ✓' : 'Copy prompt'}
                    </button>
                  </div>
                  <pre id="prompt">{prompt.text}</pre>
                </section>
              ) : (
                <p className="done-note">Done. Nothing to copy.</p>
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
