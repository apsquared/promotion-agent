import { createHash } from 'node:crypto';
import { parseTaskSnapshot } from './legacy-tasks.mjs';

export const contentHash = (data: string | Uint8Array): string => createHash('sha256').update(data).digest('hex');

/** Conservative import gate. The permissive legacy parser remains unchanged. */
export function strictTaskSnapshot(markdown: string) {
  const diagnostics: string[] = [];
  const lines = markdown.split('\n');
  const parseLines = [...lines];
  const headers: { taskId: string; checkboxOffset: number }[] = [];
  const sections = new Set<string>();
  let section: string | null = null;
  let fence: string | null = null;
  let active = false;
  let field = false;
  let fields = new Set<string>();
  let offset = 0;
  const finish = () => {
    if (active && !fields.has('materials')) diagnostics.push('Task missing Materials field');
    active = false; field = false; fields = new Set();
  };
  for (const [i, raw] of lines.entries()) {
    const line = raw.replace(/\r$/, '');
    const at = `line ${i + 1}`;
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker || fence) {
      if (section) diagnostics.push(`Fenced block inside task sections on ${at}`);
      if (fence) { if (marker?.[1][0] === fence[0] && marker[1].length >= fence.length) fence = null; }
      else fence = marker![1];
      parseLines[i] = '';
      offset += raw.length + 1;
      continue;
    }
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      finish();
      const name = heading[1].toLowerCase();
      if (name === 'open' || name === 'done') {
        if (sections.has(name)) diagnostics.push(`Duplicate section on ${at}`);
        sections.add(name); section = name;
      } else {
        if (sections.size) diagnostics.push(`Unexpected section on ${at}`);
        section = null;
      }
    } else if (/^- \[[ xX]\]\s*T-\d+\s*\|/.test(line)) {
      finish();
      if (!section) diagnostics.push(`Task outside Open/Done on ${at}`);
      const id = line.match(/T-\d+/)![0];
      headers.push({ taskId: id, checkboxOffset: offset + 3 });
      active = true;
    } else if (section && line.trim()) {
      const fieldMatch = line.match(/^\s+(URL|Materials|Prompt):/i);
      if (fieldMatch && active) {
        const name = fieldMatch[1].toLowerCase();
        if (fields.has(name)) diagnostics.push(`Duplicate ${name} field on ${at}`);
        fields.add(name); field = true;
      } else if (!active || !field || !/^\s+\S/.test(line) || /^\s*-\s*\[/.test(line)) {
        diagnostics.push(`Unsupported task content on ${at}`);
      }
    }
    offset += raw.length + 1;
  }
  finish();
  if (fence) diagnostics.push('Unclosed fenced block');
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(markdown) || /\r(?!\n)/.test(markdown)) diagnostics.push('Unsupported control characters/line endings');
  const parsed = parseTaskSnapshot(parseLines.join('\n'));
  diagnostics.push(...parsed.diagnostics);
  if (headers.length !== parsed.tasks.length) diagnostics.push('Task header/parser count mismatch');
  for (const task of parsed.tasks) {
    const date = new Date(`${task.filedDate}T00:00:00.000Z`);
    if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== task.filedDate) diagnostics.push(`Invalid calendar date: ${task.taskId}`);
  }
  return { tasks: parsed.tasks, headers, diagnostics, canReconcile: diagnostics.length === 0 };
}

/** Only mutate the checkbox byte: preserve every material, prompt, newline and unrelated byte. */
export function completeTaskText(markdown: string, taskId: string): string {
  const snapshot = strictTaskSnapshot(markdown);
  if (!snapshot.canReconcile) throw new Error(`Invalid snapshot: ${snapshot.diagnostics.join('; ')}`);
  const header = snapshot.headers.find(h => h.taskId === taskId);
  if (!header) throw new Error('Task not found');
  const result = markdown.slice(0, header.checkboxOffset) + 'x' + markdown.slice(header.checkboxOffset + 1);
  if (!strictTaskSnapshot(result).canReconcile) throw new Error('Edited snapshot is invalid');
  return result;
}
