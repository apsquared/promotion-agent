import { timingSafeEqual } from 'node:crypto';
import { configuredDirectories, reviewBoard } from '../../../src/review/data.ts';
import { applyReviewAction, parseReviewAction } from '../../../src/review/actions.ts';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
const maxBody = 16 * 1024;
/** Same-origin, session-token and configured-project checks shared by reads and actions. */
function guard(request: Request) {
  const token = process.env.PROMOTION_REVIEW_TOKEN;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  const expectedOrigin = process.env.PROMOTION_REVIEW_ORIGIN;
  if (
    (expectedOrigin && request.headers.get('host') !== new URL(expectedOrigin).host) ||
    (request.headers.get('origin') &&
      request.headers.get('origin') !== (expectedOrigin ?? new URL(request.url).origin)) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return Response.json(
      { error: 'Open the review screen in its configured session.' },
      { status: 403, headers },
    );
  }
  if (
    !token ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(token) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))
  ) {
    return Response.json(
      { error: 'Open the session link printed by the review launcher.' },
      { status: 401, headers },
    );
  }
  try {
    if (configuredDirectories().length || database()) return null;
  } catch {}
  return Response.json(
    { error: 'No projects configured for this review server.' },
    { status: 503, headers },
  );
}
const database = () => process.env.PROMOTION_REVIEW_DATABASE || undefined;
/** Every configured workspace; individual unreadable workspaces are reported inside the board. */
const board = () => reviewBoard(configuredDirectories(), database());
function read() {
  try {
    return Response.json(board(), { headers });
  } catch {
    return Response.json(
      { error: 'Projects could not be read. Restore their configuration and files, then refresh.' },
      { status: 409, headers },
    );
  }
}
export function GET(request: Request) {
  return guard(request) ?? read();
}
/** Mark a task complete, skipped, or back to active, then return the fresh board. The project is chosen by stable ID, never by path. */
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return Response.json({ error: 'Send JSON.' }, { status: 415, headers });
  try {
    const body = await request.text();
    if (Buffer.byteLength(body) > maxBody) throw new Error('Request too large');
    const action = parseReviewAction(JSON.parse(body));
    const project = board().projects.find((entry) => entry.project.id === action.projectId);
    if (!project) throw new Error('Project is not on this review board');
    applyReviewAction(project.project.root, database(), action);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 409, headers });
  }
  return read();
}
