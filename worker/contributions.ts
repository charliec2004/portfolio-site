import fallback from '../src/data/contributions.json';
import { GITHUB_USER, parseContributions, renderContributionGraph, validContributions } from '../src/lib/contributions.js';
import type { Contributions } from '../src/lib/contributions.js';

export const CONTRIBUTIONS_KEY = 'github-contributions:v1';

export async function readContributions(env: Env): Promise<{ data: Contributions; source: string }> {
  try {
    const stored = await env.CONTRIBUTIONS.get(CONTRIBUTIONS_KEY, { type: 'json', cacheTtl: 60 });
    if (validContributions(stored)) return { data: stored, source: 'kv' };
    console.warn('contributions snapshot missing or invalid; using bundled fallback');
  } catch (error) {
    console.error('contributions storage unavailable; using bundled fallback', error);
  }
  return { data: fallback, source: 'fallback' };
}

// Cron is the sole runtime writer: visitor traffic cannot cause a GitHub stampede.
export async function refreshContributions(env: Env) {
  try {
    const response = await fetch(`https://github.com/users/${GITHUB_USER}/contributions`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'charles-conner-portfolio', Accept: 'text/html' },
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
    const data = parseContributions(await response.text());
    // No expiry: upstream outages must never delete the last successful result.
    await env.CONTRIBUTIONS.put(CONTRIBUTIONS_KEY, JSON.stringify(data));
    console.log(JSON.stringify({ message: 'contributions refreshed', total: data.total, fetchedAt: data.fetchedAt }));
  } catch (error) {
    console.error('contributions refresh failed; keeping last successful snapshot', error);
    throw error; // Mark the Cron run failed for Cloudflare observability.
  }
}

export async function contributionResponse(request: Request, env: Env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed.', { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
  }
  const { data, source } = await readContributions(env);
  return new Response(request.method === 'HEAD' ? null : renderContributionGraph(data), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Contributions-Source': source,
      'X-Contributions-Updated': data.fetchedAt ?? 'build-snapshot',
    },
  });
}

export async function updateContributionHTML(response: Response, env: Env) {
  if (!response.ok || !response.headers.get('Content-Type')?.includes('text/html')) return response;
  const { data, source } = await readContributions(env);
  const updated = new HTMLRewriter().on('.contributions-island', {
    element(element) {
      element.setInnerContent(renderContributionGraph(data), { html: true });
    },
  }).transform(response);
  // Asset validators no longer identify the transformed representation.
  for (const name of ['ETag', 'Last-Modified', 'Content-Length']) updated.headers.delete(name);
  updated.headers.set('X-Contributions-Source', source);
  updated.headers.set('X-Contributions-Updated', data.fetchedAt ?? 'build-snapshot');
  return updated;
}
