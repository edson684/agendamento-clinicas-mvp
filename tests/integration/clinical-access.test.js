import test from 'node:test';
import assert from 'node:assert/strict';
import { makeApp } from '../helpers.js';

test('autorização clínica: recepção e administrador negados; profissional só com vínculo', async () => {
  const { s, as } = await makeApp();
  const rita = await as('rita@demo.br'), admin = await as('admin@demo.br'), ana = await as('ana@demo.br');
  const carlos = await as('carlos@demo.br'), lia = await as('lia@demo.br');
  const pacienteAna = ana.subjectId;
  await assert.rejects(s.clinicalRecords.list(rita, { pacienteId: pacienteAna }), { code: 'FORBIDDEN' });
  await assert.rejects(s.clinicalRecords.list(admin, { pacienteId: pacienteAna }), { code: 'FORBIDDEN' });
  await assert.rejects(s.clinicalRecords.list(ana, { pacienteId: pacienteAna }), { code: 'FORBIDDEN' });
  await assert.rejects(s.clinicalRecords.list(lia, { pacienteId: pacienteAna }), { code: 'FORBIDDEN' }); // papel certo, sem vínculo
  const regs = await s.clinicalRecords.list(carlos, { pacienteId: pacienteAna });
  assert.equal(regs[0].texto, 'Alergia a dipirona');
});

test('cancelar a consulta encerra o vínculo clínico (acesso contextual)', async () => {
  const { s, as } = await makeApp();
  const rita = await as('rita@demo.br'), carlos = await as('carlos@demo.br');
  const [a] = await s.appointments.list(carlos);
  await s.appointments.cancel(rita, { agendamentoId: a.id });
  await assert.rejects(s.clinicalRecords.list(carlos, { pacienteId: a.pacienteId }), { code: 'FORBIDDEN' });
});

test('auditoria registra acessos e negações, mas nunca conteúdo clínico, senha ou token', async () => {
  const { s, as } = await makeApp();
  const carlos = await as('carlos@demo.br'), admin = await as('admin@demo.br'), rita = await as('rita@demo.br');
  const ana = (await s.appointments.list(carlos))[0].pacienteId;
  await s.clinicalRecords.add(carlos, { pacienteId: ana, tipo: 'OBSERVACAO', texto: 'SEGREDO-CLINICO-XYZ' });
  await s.clinicalRecords.list(rita, { pacienteId: ana }).catch(() => {});
  const log = await s.audit.list(admin);
  const txt = JSON.stringify(log);
  assert.ok(log.some((r) => r.evento === 'ClinicalRecordAdded' && r.recurso === ana));
  assert.ok(log.some((r) => r.evento === 'AccessDenied' && r.resultado === 'NEGADO'));
  for (const proibido of ['SEGREDO-CLINICO-XYZ', 'senha123', 'dipirona', 'token']) assert.ok(!txt.includes(proibido), proibido);
  await assert.rejects(s.audit.list(carlos), { code: 'FORBIDDEN' }); // acesso à auditoria é restrito
  assert.ok((await s.audit.list(admin)).some((r) => r.evento === 'AuditAccessed')); // e também auditado
});
