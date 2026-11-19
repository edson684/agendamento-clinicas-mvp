// Servidor estático mínimo (sem dependências): npm start → http://localhost:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css' };
createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, p === '/' ? 'index.html' : p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'text/plain' }).end(await readFile(file)); }
  catch { res.writeHead(404).end('Não encontrado'); }
}).listen(process.env.PORT ?? 3000, () => console.log(`Abra http://localhost:${process.env.PORT ?? 3000}`));
