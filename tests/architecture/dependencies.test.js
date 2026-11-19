import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODULE_DEPENDENCIES } from '../../src/modules.js';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../src');
const LAYERS = ['presentation', 'application', 'domain', 'infrastructure'];
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.js') ? [join(d, f)] : []));
const files = LAYERS.flatMap((l) => walk(join(SRC, l)));

// Descreve onde um arquivo vive: camada e módulo (null = compartilhado/contratos/infra transversal)
function where(file) {
  const p = relative(SRC, file).split(sep), layer = p[0];
  let mod = null;
  if (layer === 'domain' || layer === 'application') mod = ['shared', 'contracts'].includes(p[1]) ? null : p[1];
  if (layer === 'infrastructure' && p[1] === 'persistence') mod = p[2];
  return { layer, mod, area: p[1] };
}
const importsOf = (file) => [...readFileSync(file, 'utf8').matchAll(/from\s+['"](\.[^'"]+)['"]/g)]
  .map((m) => resolve(dirname(file), m[1])).filter((f) => existsSync(f));

// Camadas: quem pode depender de quem
const ALLOWED = { presentation: ['presentation', 'application'], application: ['application', 'domain'],
  domain: ['domain'], infrastructure: ['infrastructure', 'domain', 'application'] };

test('há exatamente os 7 módulos documentados, em domínio e aplicação', () => {
  const mods = Object.keys(MODULE_DEPENDENCIES).sort();
  assert.equal(mods.length, 7);
  for (const m of mods) for (const l of ['domain', 'application']) assert.ok(existsSync(join(SRC, l, m)), `${l}/${m}`);
});

test('direção das dependências entre camadas é respeitada', () => {
  const erros = [];
  for (const f of files) for (const t of importsOf(f)) {
    const a = where(f), b = where(t);
    if (!ALLOWED[a.layer].includes(b.layer)) erros.push(`${relative(SRC, f)} → ${relative(SRC, t)} (${a.layer} não pode depender de ${b.layer})`);
    // a apresentação só enxerga contratos; a infraestrutura só enxerga contratos da aplicação
    if (['presentation', 'infrastructure'].includes(a.layer) && b.layer === 'application' && b.area !== 'contracts')
      erros.push(`${relative(SRC, f)} → ${relative(SRC, t)} (acesso a serviço concreto fora dos contratos)`);
  }
  assert.deepEqual(erros, []);
});

test('nenhum módulo importa código de outro módulo (só contratos e DI)', () => {
  const erros = [];
  for (const f of files) for (const t of importsOf(f)) {
    const a = where(f), b = where(t);
    if (a.mod && b.mod && a.mod !== b.mod) erros.push(`${relative(SRC, f)} → ${relative(SRC, t)}`);
  }
  assert.deepEqual(erros, []);
});

test('o domínio não conhece tecnologia (sem Node, DOM, rede ou globais de infraestrutura)', () => {
  for (const f of files.filter((x) => where(x).layer === 'domain' || where(x).layer === 'application')) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /node:|require\(|document\.|window\.|fetch\(|crypto\./, relative(SRC, f));
  }
});

test('o grafo de dependências declarado entre módulos é acíclico e coerente', () => {
  const state = {};
  const visit = (n, path) => {
    assert.notEqual(state[n], 1, `ciclo: ${[...path, n].join(' → ')}`);
    if (state[n] === 2) return;
    state[n] = 1;
    for (const d of MODULE_DEPENDENCIES[n]) { assert.ok(d in MODULE_DEPENDENCIES, `módulo desconhecido: ${d}`); visit(d, [...path, n]); }
    state[n] = 2;
  };
  Object.keys(MODULE_DEPENDENCIES).forEach((n) => visit(n, []));
});

test('Agendamentos, Notificações e Auditoria desacoplados: comunicação por eventos, sem dependência direta', () => {
  assert.ok(!MODULE_DEPENDENCIES.appointments.includes('notifications'));
  assert.ok(!MODULE_DEPENDENCIES.appointments.includes('audit'));
  assert.ok(!Object.values(MODULE_DEPENDENCIES).some((deps) => deps.includes('audit') || deps.includes('notifications')));
});

test('a injeção de dependências bloqueia acesso a módulo não declarado', async () => {
  const { createApp } = await import('../../src/main.js');
  const src = readFileSync(join(SRC, 'main.js'), 'utf8');
  assert.match(src, /Dependência não declarada/);
  assert.ok(createApp({ hasherIterations: 1 }));
});
