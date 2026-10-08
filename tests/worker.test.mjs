import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { readFile } from 'node:fs/promises';

// Exercise the actual Worker runtime, including HTMLRewriter and persistent KV.
test('Worker serves fresh SSR/API graphs, refreshes on schedule, and retains data on upstream failure', async () => {
  const bundle = await build({ entryPoints: ['worker/index.ts'], bundle: true, format: 'esm', write: false });
  const fallback = JSON.parse(await readFile('src/data/contributions.json', 'utf8'));
  let upstreamStatus = 200;
  const end = new Date().toISOString().slice(0, 10);
  let upstream = '';
  for (let i = 364; i >= 0; i--) {
    const date = new Date(Date.parse(end) - i * 86400000).toISOString().slice(0, 10);
    upstream += `<td class="ContributionCalendar-day" id="d-${i}" data-date="${date}" data-level="1"></td><tool-tip for="d-${i}">3 contributions on ${date}.</tool-tip>`;
  }
  const mf = new Miniflare({
    modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-07-27', compatibilityFlags: ['nodejs_compat'],
    kvNamespaces: ['CONTRIBUTIONS'],
    serviceBindings: { ASSETS: (request) => {
      if (new URL(request.url).pathname === '/llms-full.txt') return new Response('Portfolio markdown');
      assert.equal(request.headers.has('If-None-Match'), false);
      return new Response('<html><div class="contributions-island">old graph</div></html>', {
        headers: { 'Content-Type': 'text/html', ETag: 'static-asset' },
      });
    } },
    outboundService: () => new Response(upstream, { status: upstreamStatus }),
  });
  try {
    const kv = await mf.getKVNamespace('CONTRIBUTIONS');
    let response = await mf.dispatchFetch('https://example.com/api/contributions');
    assert.equal(response.headers.get('X-Contributions-Source'), 'fallback');
    assert.match(await response.text(), new RegExp(`${fallback.total.toLocaleString('en-US')} contributions`));
    response = await mf.dispatchFetch('https://example.com/api/contributions', { method: 'POST' });
    assert.equal(response.status, 405);
    const worker = await mf.getWorker();
    const result = await worker.scheduled({ cron: '*/15 * * * *' });
    assert.equal(result.outcome, 'ok');
    const stored = await kv.get('github-contributions:v1', 'json');
    assert.equal(stored.total, stored.days.length * 3);
    response = await mf.dispatchFetch('https://example.com/', { headers: { 'If-None-Match': 'static-asset' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('ETag'), null);
    assert.equal(response.headers.get('Cache-Control'), 'no-cache');
    assert.equal(response.headers.get('X-Contributions-Source'), 'kv');
    assert.match(await response.text(), new RegExp(`${stored.total.toLocaleString('en-US')} contributions`));
    assert.match(response.headers.get('Content-Security-Policy'), /connect-src 'self'/);
    response = await mf.dispatchFetch('https://example.com/api/contributions', { method: 'HEAD' });
    assert.equal(await response.text(), '');
    assert.equal(response.headers.get('X-Contributions-Updated'), stored.fetchedAt);
    upstreamStatus = 503;
    assert.equal((await worker.scheduled({ cron: '*/15 * * * *' })).outcome, 'exception');
    assert.deepEqual(await kv.get('github-contributions:v1', 'json'), stored);
    response = await mf.dispatchFetch('https://example.com/', { headers: { Accept: 'text/markdown' } });
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(await response.text(), 'Portfolio markdown');
    await kv.put('github-contributions:v1', '{"invalid":true}');
    response = await mf.dispatchFetch('https://example.com/api/contributions');
    assert.equal(response.headers.get('X-Contributions-Source'), 'fallback');
  } finally { await mf.dispose(); }
});
