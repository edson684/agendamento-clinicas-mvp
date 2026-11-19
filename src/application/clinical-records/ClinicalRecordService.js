import { Events } from '../contracts/events.js';
import { createEntry } from '../../domain/clinical-records/entry.js';
import { canAccessClinical } from '../../domain/clinical-records/accessPolicy.js';

export class ClinicalRecordService {
  constructor({ records, auth, patients, appointments, bus, clock = () => new Date() }) {
    Object.assign(this, { records, auth, patients, appointments, bus, clock });
  }

  async list(actor, { pacienteId }) {
    await this.#gate(actor, pacienteId);
    await this.bus.publish({ name: Events.ClinicalRecordViewed, ator: actor.accountId, recurso: pacienteId, resultado: 'OK' });
    return this.records.byPatient(pacienteId);
  }

  async add(actor, { pacienteId, tipo, texto }) {
    await this.#gate(actor, pacienteId);
    const e = createEntry({ id: this.records.nextId(), pacienteId, tipo, texto,
      autorId: actor.subjectId, quando: this.clock().toISOString() });
    this.records.append(e);
    // O evento NÃO carrega o texto clínico: a auditoria registra quem/quando/qual paciente, não o conteúdo.
    await this.bus.publish({ name: Events.ClinicalRecordAdded, ator: actor.accountId, recurso: pacienteId, resultado: 'OK' });
    return e.id;
  }

  /** RBAC (papel) + autorização contextual (vínculo com o paciente específico). */
  async #gate(actor, pacienteId) {
    await this.auth.authorize(actor, 'clinical:access');
    await this.patients.summary(pacienteId);
    const hasRelationship = await this.appointments.hasRelationship({ profissionalId: actor.subjectId, pacienteId });
    if (!canAccessClinical({ hasRelationship })) await this.auth.deny(actor, pacienteId, 'sem vínculo com o paciente');
  }
}
