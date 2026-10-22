import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const files = { '/': ['index.html', 'text/html'], '/style.css': ['style.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'], '/conversion.js': ['conversion.js', 'text/javascript'] };
export const server = createServer(async (request, response) => {
  const file = files[request.url];
  if (!file || !['GET', 'HEAD'].includes(request.method)) { response.writeHead(404); response.end(); return; }
  try {
    const content = await readFile(new URL(`../public/${file[0]}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'", 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(500); response.end(); }
});
server.listen(3000, '127.0.0.1', () => console.log('Base64: http://127.0.0.1:3000'));
