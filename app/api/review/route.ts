import { timingSafeEqual } from 'node:crypto';
import { reviewData } from '../../../src/review/data.ts';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
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
  const project = process.env.PROMOTION_REVIEW_PROJECT;
  if (!project)
    return Response.json(
      { error: 'No project configured for this review server.' },
      { status: 503, headers },
    );
  try {
    return Response.json(reviewData(project, process.env.PROMOTION_REVIEW_DATABASE), { headers });
  } catch {
    return Response.json(
      { error: 'Project could not be read. Restore its configuration and files, then refresh.' },
      { status: 409, headers },
    );
  }
}
