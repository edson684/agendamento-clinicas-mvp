import test from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, slot } from '../helpers.js';
import { nextWeekdays } from '../../src/application/contracts/dates.js';

const [, d2] = nextWeekdays(new Date(), 2);

test('reservas simultâneas do mesmo horário: apenas uma vence (Conascência Temporal)', async () => {
  const { s, as, events } = await makeApp();
  const ana = await as('ana@demo.br'), bruno = await as('bruno@demo.br');
  const lia = (await s.professionals.list(ana)).find((p) => p.nome === 'Dra. Lia').id;
  const mk = (a) => s.appointments.book(a, { pacienteId: a.subjectId, profissionalId: lia, ...slot(d2, 9) });
  const r = await Promise.allSettled([mk(ana), mk(bruno)]);
  assert.equal(r.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal(r.find((x) => x.status === 'rejected').reason.code, 'CONFLICT');
  assert.equal(events.filter((e) => e.name === 'AppointmentCreated' && e.inicio === slot(d2, 9).inicio).length, 1,
    'nenhum evento para a reserva que falhou (Conascência de Execução)');
});

test('horário reservado deixa de aparecer na disponibilidade; cancelar o libera', async () => {
  const { s, as } = await makeApp();
  const rita = await as('rita@demo.br'), ana = await as('ana@demo.br');
  const carlos = (await s.professionals.list(rita)).find((p) => p.nome === 'Dr. Carlos').id;
  const id = await s.appointments.book(ana, { pacienteId: ana.subjectId, profissionalId: carlos, ...slot(d2, 10) });
  const livres = async () => (await s.appointments.availableSlots(rita, { profissionalId: carlos, data: d2 })).map((x) => x.inicio.slice(11));
  assert.ok(!(await livres()).includes('10:00'));
  await s.appointments.cancel(ana, { agendamentoId: id });
  assert.ok((await livres()).includes('10:00'));
});

test('remarcar respeita conflito e dispara evento; horário fora da agenda habitual é recusado', async () => {
  const { s, as, events } = await makeApp();
  const rita = await as('rita@demo.br'), ana = await as('ana@demo.br');
  const carlos = (await s.professionals.list(rita)).find((p) => p.nome === 'Dr. Carlos').id;
  const id = await s.appointments.book(ana, { pacienteId: ana.subjectId, profissionalId: carlos, ...slot(d2, 9) });
  await s.appointments.book(rita, { pacienteId: ana.subjectId, profissionalId: carlos, ...slot(d2, 11) });
  await assert.rejects(s.appointments.reschedule(ana, { agendamentoId: id, novoInicio: slot(d2, 11).inicio, novoFim: slot(d2, 11).fim }), { code: 'CONFLICT' });
  await s.appointments.reschedule(ana, { agendamentoId: id, novoInicio: slot(d2, 14).inicio, novoFim: slot(d2, 14).fim });
  assert.ok(events.some((e) => e.name === 'AppointmentRescheduled'));
  await assert.rejects(s.appointments.book(rita, { pacienteId: ana.subjectId, profissionalId: carlos, ...slot(d2, 20) }), { code: 'VALIDATION' });
});

test('paciente não mexe em consulta de outro paciente (autorização no backend + auditoria)', async () => {
  const { s, as, events } = await makeApp();
  const ana = await as('ana@demo.br'), bruno = await as('bruno@demo.br');
  const [minha] = await s.appointments.list(ana);
  await assert.rejects(s.appointments.cancel(bruno, { agendamentoId: minha.id }), { code: 'FORBIDDEN' });
  assert.ok(events.some((e) => e.name === 'AccessDenied' && e.ator === bruno.accountId));
  assert.equal((await s.appointments.list(bruno)).every((a) => a.pacienteId === bruno.subjectId), true);
});

test('máquina de estados: não é possível cancelar o que já foi concluído', async () => {
  const { s, as } = await makeApp();
  const rita = await as('rita@demo.br'), carlos = await as('carlos@demo.br');
  const [a] = await s.appointments.list(carlos);
  await s.appointments.complete(carlos, { agendamentoId: a.id });
  await assert.rejects(s.appointments.cancel(rita, { agendamentoId: a.id }), { code: 'CONFLICT' });
});
