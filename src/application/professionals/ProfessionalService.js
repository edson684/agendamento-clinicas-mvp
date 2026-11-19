import { Events } from '../contracts/events.js';
import { createProfessional, slotsForDate, validateSchedule } from '../../domain/professionals/professional.js';
import { notFound } from '../../domain/shared/errors.js';

export class ProfessionalService {
  constructor({ professionals, auth, bus }) { Object.assign(this, { professionals, auth, bus }); }

  async register(actor, { nome, especialidade, horarios }) {
    await this.auth.authorize(actor, 'professional:manage');
    const p = createProfessional({ id: this.professionals.nextId(), nome, especialidade, horarios });
    this.professionals.save(p);
    await this.bus.publish({ name: Events.ProfessionalCreated, ator: actor.accountId, recurso: p.id, resultado: 'OK' });
    return p.id;
  }

  async list(actor) {
    await this.auth.authorize(actor, 'professional:list');
    return this.professionals.all().map(({ id, nome, especialidade }) => ({ id, nome, especialidade }));
  }

  async updateSchedule(actor, { profissionalId, horarios }) {
    await this.auth.authorize(actor, 'professional:manage');
    const p = this.#find(profissionalId);
    this.professionals.save(Object.freeze({ ...p, horarios: validateSchedule(horarios) }));
    await this.bus.publish({ name: Events.ProfessionalScheduleChanged, ator: actor.accountId,
      recurso: profissionalId, resultado: 'OK' });
  }

  // ---- contratos entre módulos ----
  async summary(id) { const { nome, especialidade } = this.#find(id); return { id, nome, especialidade }; }
  async habitualSlots(id, data) { return slotsForDate(this.#find(id), data); }

  #find(id) {
    const p = this.professionals.findById(id);
    if (!p) throw notFound('Profissional inexistente');
    return p;
  }
}
