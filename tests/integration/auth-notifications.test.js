import test from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, FlakyChannel, slot } from '../helpers.js';
import { DEMO_PASSWORD } from '../../src/seed.js';
import { nextWeekdays } from '../../src/application/contracts/dates.js';

test('login: senha só existe como hash; 5 falhas bloqueiam a conta', async () => {
  const { app, s } = await makeApp();
  assert.ok(app.repos.accounts.findByEmail('ana@demo.br').senhaHash.startsWith('pbkdf2$'));
  for (let i = 0; i < 5; i++) await assert.rejects(s.auth.login({ email: 'ana@demo.br', senha: 'errada' }), { code: 'UNAUTHENTICATED' });
  await assert.rejects(s.auth.login({ email: 'ana@demo.br', senha: DEMO_PASSWORD }), { code: 'UNAUTHENTICATED' });
});

test('controllers exigem sessão válida e convertem erros de domínio em respostas', async () => {
  const { app } = await makeApp();
  const c = app.controllers;
  assert.equal((await c.patients.list('token-invalido')).error.code, 'UNAUTHENTICATED');
  const login = await c.auth.login({ email: 'ana@demo.br', senha: DEMO_PASSWORD });
  assert.ok(login.ok && login.data.token);
  assert.equal((await c.audit.list(login.data.token)).error.code, 'FORBIDDEN');
  await c.auth.logout(login.data.token);
  assert.equal((await c.appointments.list(login.data.token)).ok, false);
});

test('notificação: texto discreto, enviada ao contato correto, e registrada sem conteúdo sensível', async () => {
  const { app, s, as } = await makeApp();
  const ana = await as('ana@demo.br');
  const minhas = await s.notifications.list(ana);
  assert.ok(minhas.length >= 1 && minhas.every((n) => n.pacienteId === ana.subjectId));
  assert.ok(app.channel.sent.every((m) => !/dermato|cl[ií]nica geral|alergia/i.test(m.texto)));
  assert.ok(app.channel.sent.some((m) => m.para === '11900000001'));
});

test('canal instável: reenvia até 3 vezes e então envia; canal fora do ar → FALHA auditada, consulta preservada', async () => {
  const instavel = await makeApp({ channel: new FlakyChannel(2) });
  const rita1 = await instavel.as('rita@demo.br');
  const primeira = (await instavel.s.notifications.list(rita1)).at(-1); // 1ª notificação da carga inicial
  assert.equal(primeira.status, 'ENVIADA'); assert.equal(primeira.tentativas, 3);

  const fora = await makeApp({ channel: new FlakyChannel(99) });
  const rita = await fora.as('rita@demo.br');
  const [, d] = nextWeekdays(new Date(), 2);
  const pacienteId = (await fora.s.appointments.list(rita))[0].pacienteId;
  const profissionalId = (await fora.s.professionals.list(rita))[0].id;
  const id = await fora.s.appointments.book(rita, { pacienteId, profissionalId, ...slot(d, 10) });
  assert.ok((await fora.s.appointments.list(rita)).some((a) => a.id === id), 'a consulta existe mesmo sem canal');
  const [n] = await fora.s.notifications.list(rita);
  assert.equal(n.status, 'FALHA'); assert.equal(n.tentativas, 3);
  assert.ok(fora.events.some((e) => e.name === 'NotificationFailed'));
});
