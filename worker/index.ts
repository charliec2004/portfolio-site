const AGENT_LINKS = [
  '</llms.txt>; rel="llms-txt"; type="text/plain"',
  '</index.md>; rel="alternate"; type="text/markdown"',
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
].join(', ');

const CONTENT_SIGNAL = 'ai-train=no, search=yes, ai-input=yes';

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self' 'sha256-+VR5tME3K6xlz48uRWxNfV/pBRk5HX0gIqQ2w2JuHEw='",
    "style-src 'self' 'unsafe-inline'",
    'upgrade-insecure-requests',
  ].join('; '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

function qualityFor(mediaRange: string): number {
  const match = /(?:^|;)\s*q=([01](?:\.\d{0,3})?)\s*(?:;|$)/i.exec(mediaRange);
  if (!match) return 1;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  let markdownQuality = -1;
  let htmlQuality = -1;

  for (const rawRange of acceptHeader.slice(0, 4096).split(',')) {
    const mediaType = rawRange.split(';', 1)[0].trim().toLowerCase();
    const quality = qualityFor(rawRange);

    if (mediaType === 'text/markdown' || mediaType === 'text/*') {
      markdownQuality = Math.max(markdownQuality, quality);
    }

    if (
      mediaType === 'text/html'
      || mediaType === 'application/xhtml+xml'
      || mediaType === '*/*'
    ) {
      htmlQuality = Math.max(htmlQuality, quality);
    }
  }

  return markdownQuality > 0 && markdownQuality >= htmlQuality;
}

function addSharedHeaders(response: Response): Response {
  const outgoing = new Response(response.body, response);
  const existingVary = outgoing.headers.get('Vary');

  outgoing.headers.set('Content-Signal', CONTENT_SIGNAL);
  outgoing.headers.set('Link', AGENT_LINKS);
  outgoing.headers.set(
    'Vary',
    existingVary ? `${existingVary}, Accept` : 'Accept',
  );

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    outgoing.headers.set(name, value);
  }

  return outgoing;
}

async function markdownResponse(request: Request, env: Env): Promise<Response> {
  const markdownUrl = new URL('/llms-full.txt', request.url);
  const assetResponse = await env.ASSETS.fetch(new Request(markdownUrl, { method: 'GET' }));

  if (!assetResponse.ok || !assetResponse.body) {
    return new Response('Markdown representation unavailable.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  const response = new Response(
    request.method === 'HEAD' ? null : assetResponse.body,
    assetResponse,
  );

  response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
  response.headers.set('Cache-Control', 'public, max-age=3600');
  response.headers.delete('Content-Encoding');
  response.headers.delete('Content-Length');
  response.headers.delete('ETag');
  response.headers.delete('Last-Modified');

  return response;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const canReturnRepresentation = request.method === 'GET' || request.method === 'HEAD';
    const explicitMarkdownPath = url.pathname === '/index.md';
    const negotiatedMarkdown = url.pathname === '/'
      && prefersMarkdown(request.headers.get('Accept'));

    try {
      if (canReturnRepresentation && (explicitMarkdownPath || negotiatedMarkdown)) {
        return addSharedHeaders(await markdownResponse(request, env));
      }

      return addSharedHeaders(await env.ASSETS.fetch(request));
    } catch (error) {
      console.error(JSON.stringify({
        message: 'request failed',
        method: request.method,
        path: url.pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));

      return addSharedHeaders(new Response('Internal server error.', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }));
    }
  },
} satisfies ExportedHandler<Env>;
