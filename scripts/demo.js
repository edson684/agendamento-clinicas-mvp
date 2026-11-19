// Demonstração em linha de comando dos fluxos exigidos como evidência: npm run demo
import { createApp } from '../src/main.js';
import { seedDemo, DEMO_PASSWORD } from '../src/seed.js';
import { nextWeekdays } from '../src/application/contracts/dates.js';

const app = createApp({ hasherIterations: 5000 });
await seedDemo(app);
const { services: s } = app;
const as = async (email) => (await s.auth.login({ email, senha: DEMO_PASSWORD })).actor;
const tenta = async (titulo, fn) => { try { const r = await fn(); console.log(`✔ ${titulo}`, r ?? ''); } catch (e) { console.log(`✘ ${titulo} → ${e.code}: ${e.message}`); } };
const [, dia] = nextWeekdays(new Date(), 2);
const slot = { inicio: `${dia}T09:00`, fim: `${dia}T10:00` };

const ana = await as('ana@demo.br'), bruno = await as('bruno@demo.br'), rita = await as('rita@demo.br');
const carlos = await as('carlos@demo.br'), admin = await as('admin@demo.br');
const pro = (await s.professionals.list(rita)).find((p) => p.nome === 'Dra. Lia').id;

console.log('\n— 1. Reserva simultânea do mesmo horário (apenas uma deve vencer)');
const r = await Promise.allSettled([ana, bruno].map((a) => s.appointments.book(a, { pacienteId: a.subjectId, profissionalId: pro, ...slot })));
r.forEach((x, i) => console.log(x.status === 'fulfilled' ? `✔ paciente ${i + 1} reservou ${x.value}` : `✘ paciente ${i + 1} → ${x.reason.code}`));

console.log('\n— 2. Acesso clínico (RBAC + vínculo contextual)');
const pacienteAna = ana.subjectId;
await tenta('Recepção lê prontuário', () => s.clinicalRecords.list(rita, { pacienteId: pacienteAna }));
await tenta('Administrador lê prontuário', () => s.clinicalRecords.list(admin, { pacienteId: pacienteAna }));
await tenta('Dr. Carlos (papel correto, mas sem vínculo com o Bruno) lê prontuário', () => s.clinicalRecords.list(carlos, { pacienteId: bruno.subjectId }));
await tenta('Dr. Carlos (com vínculo com a Ana) lê prontuário', async () => (await s.clinicalRecords.list(carlos, { pacienteId: pacienteAna })).map((e) => e.texto));

console.log('\n— 3. Notificações externas (texto discreto, sem especialidade)');
app.channel.sent.slice(-3).forEach((m) => console.log(`  → ${m.para}: ${m.texto}`));

console.log('\n— 4. Auditoria (somente metadados; nada de conteúdo clínico, senha ou token)');
(await s.audit.list(admin)).slice(0, 6).forEach((a) => console.log(`  ${a.quando.slice(11, 19)} ${a.evento.padEnd(22)} ator=${a.ator} recurso=${a.recurso} ${a.resultado}`));
