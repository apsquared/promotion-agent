// Extracted legacy compatibility parser. See docs/EXTRACTION.md.
// Do not use permissive parseTasks alone to authorize deletion reconciliation.
const TASK_HEADER =
  /^- \[( |x|X)\]\s*(T-\d+)\s*\|\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[^|]*?)\s*\|\s*(P\d)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*$/;

/** Remove the common leading indentation from a block of lines. */
function dedent(lines) {
  const indents = lines
    .filter((l) => l.trim())
    .map((l) => (l.match(/^[ \t]*/) || [''])[0].length);
  const base = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(base)).join('\n').replace(/\s+$/, '');
}

/**
 * Parse a TASKS.md body into task objects. Captures both ## Open and ## Done.
 * Each task header is followed by indented continuation lines; a `URL:` marker
 * begins the action URL, a `Materials:` marker begins the materials block, and
 * an optional `Prompt:` marker begins a ready-to-paste agent prompt (any of
 * which may be an inline value and/or a multi-line block). Lines are routed to
 * whichever field is currently active, so a bare `Materials:` line followed by
 * bullets is captured correctly.
 */
export function parseTasks(md) {
  const lines = md.split('\n');
  const tasks = [];
  let section = null; // 'open' | 'done' | null
  let current = null;
  let field = null; // 'url' | 'materials' | 'prompt' | null

  // Join a field's inline value with its indented continuation block.
  const join = (inline, lines) =>
    [inline, dedent(lines)].filter((s) => s && s.trim()).join('\n').trim();

  const flush = () => {
    if (current) {
      current.materials = join(current._matInline, current._matLines);
      current.agentPrompt = join(current._promptInline, current._promptLines);
      current.actionUrl = current.actionUrl.trim();
      delete current._matInline;
      delete current._matLines;
      delete current._promptInline;
      delete current._promptLines;
      tasks.push(current);
    }
    current = null;
    field = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const header = line.match(/^##\s+(.+?)\s*$/);
    if (header) {
      flush();
      const h = header[1].toLowerCase();
      section = h.startsWith('open') ? 'open' : h.startsWith('done') ? 'done' : null;
      continue;
    }
    if (section == null) continue;

    const m = line.match(TASK_HEADER);
    if (m) {
      flush();
      const checked = m[1].toLowerCase() === 'x';
      current = {
        checked,
        taskId: m[2],
        filedDate: m[3].trim(),
        priority: m[4].trim(),
        category: m[5].trim(),
        title: m[6].trim(),
        actionUrl: '',
        materials: '',
        agentPrompt: '',
        // Open + unchecked = live. Anything checked, or under ## Done, is done.
        status: section === 'done' || checked ? 'done' : 'open',
        rawSection: section,
        _matInline: '',
        _matLines: [],
        _promptInline: '',
        _promptLines: [],
      };
      field = null;
      continue;
    }

    if (!current) continue;

    const trimmed = line.trim();
    const urlM = trimmed.match(/^URL:\s*(.*)$/i);
    const matM = trimmed.match(/^Materials:\s*(.*)$/i);
    const promptM = trimmed.match(/^Prompt:\s*(.*)$/i);
    if (urlM) {
      current.actionUrl = urlM[1].trim();
      field = 'url';
    } else if (matM) {
      current._matInline = matM[1].trim();
      field = 'materials';
    } else if (promptM) {
      current._promptInline = promptM[1].trim();
      field = 'prompt';
    } else if (field === 'materials') {
      current._matLines.push(line); // keep raw indent for dedent
    } else if (field === 'prompt') {
      current._promptLines.push(line);
    } else if (field === 'url' && trimmed) {
      current.actionUrl += (current.actionUrl ? ' ' : '') + trimmed;
    }
  }
  flush();
  return tasks;
}


/** Validate the document before accepting it as a complete reconciliation snapshot. */
export function parseTaskSnapshot(md) {
  const tasks = parseTasks(md);
  const diagnostics = [];
  const ids = new Set();
  let section = null;
  let sawOpen = false;
  for (const [index, raw] of md.split('\n').entries()) {
    const line = raw.replace(/\s+$/, '');
    const header = line.match(/^##\s+(.+?)\s*$/);
    if (header) {
      const name = header[1].toLowerCase();
      section = name === 'open' || name === 'done' ? name : null;
      if (name === 'open') sawOpen = true;
      if (/^(open|done)/.test(name) && !section) diagnostics.push(`Ambiguous section on line ${index + 1}`);
      continue;
    }
    if (section && /^\s*- \[/.test(line) && !TASK_HEADER.test(line)) {
      diagnostics.push(`Malformed task header on line ${index + 1}`);
    }
  }
  if (!sawOpen) diagnostics.push('Missing exact ## Open section');
  for (const task of tasks) {
    if (ids.has(task.taskId)) diagnostics.push(`Duplicate task ID: ${task.taskId}`);
    ids.add(task.taskId);
    if (!/^P[123]$/.test(task.priority)) diagnostics.push(`Invalid priority: ${task.taskId}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(task.filedDate)) diagnostics.push(`Invalid date format: ${task.taskId}`);
  }
  return { tasks, diagnostics, canReconcile: diagnostics.length === 0 };
}
