import { Events } from '../contracts/events.js';
import { createPatient, updateContact } from '../../domain/patients/patient.js';
import { notFound } from '../../domain/shared/errors.js';

export class PatientService {
  constructor({ patients, auth, bus }) { Object.assign(this, { patients, auth, bus }); }

  async register(actor, { nome, telefone, email }) {
    await this.auth.authorize(actor, 'patient:manage');
    const p = createPatient({ id: this.patients.nextId(), nome, telefone, email });
    this.patients.save(p);
    await this.bus.publish({ name: Events.PatientCreated, ator: actor.accountId, recurso: p.id, resultado: 'OK' });
    return p.id;
  }

  async list(actor) {
    await this.auth.authorize(actor, 'patient:read');
    return this.patients.all().map(({ id, nome }) => ({ id, nome }));
  }

  async updateContact(actor, { pacienteId, telefone, email }) {
    await this.auth.authorize(actor, 'patient:manage');
    const p = this.#find(pacienteId);
    this.patients.save(updateContact(p, { telefone, email }));
    await this.bus.publish({ name: Events.PatientUpdated, ator: actor.accountId, recurso: pacienteId, resultado: 'OK' });
  }

  // ---- contratos entre módulos (o chamador já autorizou a operação) ----
  async summary(pacienteId) { const { id, nome } = this.#find(pacienteId); return { id, nome }; }
  async contactOf(pacienteId) { const { telefone, email } = this.#find(pacienteId); return { telefone, email }; }

  #find(id) {
    const p = this.patients.findById(id);
    if (!p) throw notFound('Paciente inexistente');
    return p;
  }
}
