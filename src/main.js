// RAIZ DE COMPOSIÇÃO: único lugar que conhece as classes concretas de todas as camadas.
// Aqui as dependências são injetadas; cada módulo só recebe os colaboradores declarados em modules.js.
import { MODULE_DEPENDENCIES } from './modules.js';
import { Events, NotifiableEvents } from './application/contracts/events.js';
import { AuthService } from './application/auth/index.js';
import { PatientService } from './application/patients/index.js';
import { ProfessionalService } from './application/professionals/index.js';
import { AppointmentService } from './application/appointments/index.js';
import { ClinicalRecordService } from './application/clinical-records/index.js';
import { NotificationService } from './application/notifications/index.js';
import { AuditService } from './application/audit/index.js';
import { InMemoryEventBus } from './infrastructure/events/inMemoryEventBus.js';
import { Pbkdf2PasswordHasher } from './infrastructure/identity/passwordHasher.js';
import { InMemorySessionStore } from './infrastructure/identity/sessionStore.js';
import { RecordingChannel } from './infrastructure/messaging/recordingChannel.js';
import { MemoryAccountRepository } from './infrastructure/persistence/auth/memoryAccountRepository.js';
import { MemoryPatientRepository } from './infrastructure/persistence/patients/memoryPatientRepository.js';
import { MemoryProfessionalRepository } from './infrastructure/persistence/professionals/memoryProfessionalRepository.js';
import { MemoryAppointmentRepository } from './infrastructure/persistence/appointments/memoryAppointmentRepository.js';
import { MemoryClinicalRecordRepository } from './infrastructure/persistence/clinical-records/memoryClinicalRecordRepository.js';
import { MemoryNotificationRepository } from './infrastructure/persistence/notifications/memoryNotificationRepository.js';
import { MemoryAuditRepository } from './infrastructure/persistence/audit/memoryAuditRepository.js';
import { createControllers } from './presentation/controllers/index.js';

export function createApp({ hasherIterations = 100_000, channel = new RecordingChannel(), clock = () => new Date(), sessionTtlMs } = {}) {
  const bus = new InMemoryEventBus({ now: clock });
  const repos = { accounts: new MemoryAccountRepository(), patients: new MemoryPatientRepository(),
    professionals: new MemoryProfessionalRepository(), appointments: new MemoryAppointmentRepository(),
    records: new MemoryClinicalRecordRepository(), notifications: new MemoryNotificationRepository(),
    audit: new MemoryAuditRepository() };

  const registry = {};
  const wire = (name, build) => {
    const allowed = MODULE_DEPENDENCIES[name];
    const deps = new Proxy({}, { get: (_, k) => {
      if (typeof k !== 'string' || !allowed.includes(k)) throw new Error(`Dependência não declarada: ${name} → ${String(k)}`);
      return registry[k];
    } });
    registry[name] = build(deps);
  };

  wire('auth', () => new AuthService({ accounts: repos.accounts, hasher: new Pbkdf2PasswordHasher({ iterations: hasherIterations }),
    sessions: new InMemorySessionStore({ ttlMs: sessionTtlMs }), bus }));
  wire('patients', (d) => new PatientService({ patients: repos.patients, auth: d.auth, bus }));
  wire('professionals', (d) => new ProfessionalService({ professionals: repos.professionals, auth: d.auth, bus }));
  wire('appointments', (d) => new AppointmentService({ appointments: repos.appointments, auth: d.auth,
    patients: d.patients, professionals: d.professionals, bus, clock }));
  wire('clinical-records', (d) => new ClinicalRecordService({ records: repos.records, auth: d.auth,
    patients: d.patients, appointments: d.appointments, bus, clock }));
  wire('notifications', (d) => new NotificationService({ notifications: repos.notifications, auth: d.auth,
    patients: d.patients, channel, bus }));
  wire('audit', (d) => new AuditService({ records: repos.audit, auth: d.auth, bus }));

  // Comunicação por EVENTOS: Agendamentos não conhece Notificações nem Auditoria.
  bus.subscribe('*', (e) => registry.audit.record(e));
  for (const name of NotifiableEvents) bus.subscribe(name, (e) => registry.notifications.handle(e));

  const services = { auth: registry.auth, patients: registry.patients, professionals: registry.professionals,
    appointments: registry.appointments, clinicalRecords: registry['clinical-records'],
    notifications: registry.notifications, audit: registry.audit };
  return { services, controllers: createControllers(services), bus, channel, repos, Events };
}
