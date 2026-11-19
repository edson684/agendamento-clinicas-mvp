// Dados de demonstração criados pelos próprios casos de uso (gera eventos, notificações e auditoria).
import { nextWeekdays } from './application/contracts/dates.js';
export const DEMO_PASSWORD = 'senha123';
export async function seedDemo(app, now = new Date()) {
  const s = app.services, boot = { accountId: 'bootstrap', role: 'administrador', subjectId: null };
  const carlos = await s.professionals.register(boot, { nome: 'Dr. Carlos', especialidade: 'Clínica geral' });
  const lia = await s.professionals.register(boot, { nome: 'Dra. Lia', especialidade: 'Dermatologia',
    horarios: { diasSemana: [1, 2, 3, 4, 5], horas: [9, 10, 14, 15] } });
  const acc = (nome, email, role, subjectId) => s.auth.register(boot, { nome, email, senha: DEMO_PASSWORD, role, subjectId });
  await acc('Rita (recepção)', 'rita@demo.br', 'recepcionista');
  await acc('Dr. Carlos', 'carlos@demo.br', 'profissional', carlos);
  await acc('Dra. Lia', 'lia@demo.br', 'profissional', lia);
  await acc('Admin', 'admin@demo.br', 'administrador');
  const rita = (await s.auth.login({ email: 'rita@demo.br', senha: DEMO_PASSWORD })).actor;
  const ana = await s.patients.register(rita, { nome: 'Ana Souza', telefone: '11900000001', email: 'ana@demo.br' });
  const bruno = await s.patients.register(rita, { nome: 'Bruno Lima', telefone: '11900000002', email: 'bruno@demo.br' });
  await acc('Ana Souza', 'ana@demo.br', 'paciente', ana);
  await acc('Bruno Lima', 'bruno@demo.br', 'paciente', bruno);
  const [d1] = nextWeekdays(now, 1);
  const a1 = await s.appointments.book(rita, { pacienteId: ana, profissionalId: carlos, inicio: `${d1}T09:00`, fim: `${d1}T10:00` });
  await s.appointments.book(rita, { pacienteId: bruno, profissionalId: lia, inicio: `${d1}T10:00`, fim: `${d1}T11:00` });
  await s.appointments.confirm(rita, { agendamentoId: a1 });
  const dr = (await s.auth.login({ email: 'carlos@demo.br', senha: DEMO_PASSWORD })).actor;
  await s.clinicalRecords.add(dr, { pacienteId: ana, tipo: 'ALERGIA', texto: 'Alergia a dipirona' });
  return [['ana@demo.br', 'Ana (paciente)'], ['bruno@demo.br', 'Bruno (paciente)'], ['rita@demo.br', 'Rita (recepção)'],
    ['carlos@demo.br', 'Dr. Carlos (profissional)'], ['lia@demo.br', 'Dra. Lia (profissional)'], ['admin@demo.br', 'Admin']]
    .map(([email, nome]) => ({ email, nome }));
}
