import test from 'node:test';
import assert from 'node:assert/strict';
import { Status, canTransition } from '../../src/domain/appointments/status.js';
import { freeSlots } from '../../src/domain/appointments/availability.js';
import { createProfessional, slotsForDate } from '../../src/domain/professionals/professional.js';
import { buildMessage } from '../../src/domain/notifications/message.js';
import { createRecord } from '../../src/domain/audit/auditRecord.js';
import { CriarAgendamentoRequest } from '../../src/application/contracts/requests.js';
import { Pbkdf2PasswordHasher } from '../../src/infrastructure/identity/passwordHasher.js';

test('máquina de estados da consulta (convenção explícita)', () => {
  assert.ok(canTransition(Status.AGENDADA, Status.CONFIRMADA));
  assert.ok(!canTransition(Status.CANCELADA, Status.CONFIRMADA));
  assert.ok(!canTransition(Status.CONCLUIDA, Status.CANCELADA));
});

test('disponibilidade efetiva = habituais − reservas − passado', () => {
  const prof = createProfessional({ id: 'r', nome: 'X', especialidade: 'Y' });
  const habituais = slotsForDate(prof, '2030-01-07'); // segunda-feira
  assert.equal(habituais.length, 4);
  assert.equal(slotsForDate(prof, '2030-01-06').length, 0); // domingo
  const livres = freeSlots(habituais, ['2030-01-07T09:00'], new Date('2030-01-01'));
  assert.deepEqual(livres.map((s) => s.inicio.slice(11)), ['10:00', '11:00', '14:00']);
  assert.equal(freeSlots(habituais, [], new Date('2031-01-01')).length, 0);
});

test('Conascência de Posição: contrato com campos nomeados rejeita dados incompletos', () => {
  assert.throws(() => CriarAgendamentoRequest({ pacienteId: 'p-1', inicio: '2030-01-07T09:00', fim: '2030-01-07T10:00' }), /profissionalId/);
  assert.throws(() => CriarAgendamentoRequest({ pacienteId: 'p', profissionalId: 'r', inicio: '2030-01-07T10:00', fim: '2030-01-07T09:00' }));
});

test('notificação externa é discreta (sem especialidade/diagnóstico)', () => {
  const txt = buildMessage('AppointmentCreated', '2030-01-07T09:00');
  assert.match(txt, /07\/01 às 09:00/);
  assert.doesNotMatch(txt, /dermato|cardio|alergia|diagn/i);
  assert.equal(buildMessage('OutroEvento', '2030-01-07T09:00'), null);
});

test('registro de auditoria descarta campos fora da lista branca', () => {
  const r = createRecord({ quando: 't', name: 'X', ator: 'a', recurso: 'p', resultado: 'OK', texto: 'SEGREDO', senha: 'x', token: 'y' });
  assert.deepEqual(Object.keys(r).sort(), ['ator', 'evento', 'quando', 'recurso', 'resultado']);
});

test('senha é armazenada com hash salgado e verificada', async () => {
  const h = new Pbkdf2PasswordHasher({ iterations: 1000 });
  const a = await h.hash('segredo123'), b = await h.hash('segredo123');
  assert.notEqual(a, b); // sal aleatório
  assert.ok(!a.includes('segredo123'));
  assert.ok(await h.verify('segredo123', a));
  assert.ok(!(await h.verify('errada', a)));
});
