import { readFile, writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  server: { middlewareMode: true },
});

try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const html = await readFile('dist/index.html', 'utf8');
  const root = '<div id="root"></div>';
  if (!html.includes(root)) throw new Error('Build output is missing the app root');

  const rendered = renderToString(createElement(App));
  await writeFile('dist/index.html', html.replace(root, `<div id="root">${rendered}</div>`));
} finally {
  await server.close();
}
