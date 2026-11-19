import { Events } from '../contracts/events.js';
import { CriarAgendamentoRequest, RemarcarAgendamentoRequest, AgendamentoIdRequest,
  ConsultaDisponibilidadeRequest } from '../contracts/requests.js';
import { createAppointment, transition, reschedule } from '../../domain/appointments/appointment.js';
import { Status } from '../../domain/appointments/status.js';
import { freeSlots } from '../../domain/appointments/availability.js';
import { notFound, validation } from '../../domain/shared/errors.js';

export class AppointmentService {
  constructor({ appointments, auth, patients, professionals, bus, clock = () => new Date() }) {
    Object.assign(this, { appointments, auth, patients, professionals, bus, clock });
  }

  async availableSlots(actor, req) {
    const { profissionalId, data } = ConsultaDisponibilidadeRequest(req);
    await this.auth.authorize(actor, 'appointment:own', 'appointment:manage', 'appointment:agenda');
    const habituais = await this.professionals.habitualSlots(profissionalId, data);
    return freeSlots(habituais, this.appointments.startsOf(profissionalId), this.clock());
  }

  async book(actor, req) {
    const r = CriarAgendamentoRequest(req);
    await this.auth.authorize(actor, 'appointment:own', 'appointment:manage');
    const pacienteId = actor.role === 'paciente' ? actor.subjectId : r.pacienteId; // paciente só agenda para si
    await this.patients.summary(pacienteId);
    await this.professionals.summary(r.profissionalId);
    await this.#assertHabitual(r.profissionalId, r.inicio, r.fim);
    const appt = createAppointment({ id: this.appointments.nextId(), pacienteId,
      profissionalId: r.profissionalId, inicio: r.inicio, fim: r.fim });
    this.appointments.reserve(appt); // atômico: verificação + gravação sob restrição única (Conascência Temporal)
    await this.#emit(Events.AppointmentCreated, actor, appt); // somente APÓS a gravação (Conascência de Execução)
    return appt.id;
  }

  async cancel(actor, req) {
    const { agendamentoId } = AgendamentoIdRequest(req);
    await this.auth.authorize(actor, 'appointment:own', 'appointment:manage');
    const appt = await this.#own(actor, agendamentoId);
    this.appointments.update(transition(appt, Status.CANCELADA));
    await this.#emit(Events.AppointmentCancelled, actor, appt);
  }

  async confirm(actor, req) {
    const { agendamentoId } = AgendamentoIdRequest(req);
    await this.auth.authorize(actor, 'appointment:manage');
    const appt = await this.#own(actor, agendamentoId);
    this.appointments.update(transition(appt, Status.CONFIRMADA));
    await this.#emit(Events.AppointmentConfirmed, actor, appt);
  }

  async complete(actor, req) {
    const { agendamentoId } = AgendamentoIdRequest(req);
    await this.auth.authorize(actor, 'appointment:agenda');
    const appt = await this.#own(actor, agendamentoId);
    this.appointments.update(transition(appt, Status.CONCLUIDA));
    await this.#emit(Events.AppointmentCompleted, actor, appt);
  }

  async reschedule(actor, req) {
    const { agendamentoId, novoInicio, novoFim } = RemarcarAgendamentoRequest(req);
    await this.auth.authorize(actor, 'appointment:own', 'appointment:manage');
    const appt = await this.#own(actor, agendamentoId);
    await this.#assertHabitual(appt.profissionalId, novoInicio, novoFim);
    const moved = reschedule(appt, { inicio: novoInicio, fim: novoFim });
    this.appointments.move(moved); // mesma garantia de atomicidade da reserva
    await this.#emit(Events.AppointmentRescheduled, actor, moved);
  }

  async list(actor) {
    await this.auth.authorize(actor, 'appointment:own', 'appointment:manage', 'appointment:agenda');
    let rows = this.appointments.all();
    if (actor.role === 'paciente') rows = rows.filter((a) => a.pacienteId === actor.subjectId);
    if (actor.role === 'profissional') rows = rows.filter((a) => a.profissionalId === actor.subjectId);
    return Promise.all(rows.map(async (a) => ({ ...a,
      pacienteNome: (await this.patients.summary(a.pacienteId)).nome,
      profissionalNome: (await this.professionals.summary(a.profissionalId)).nome })));
  }

  /** Contrato para Informações Clínicas: existe atendimento legítimo entre profissional e paciente? */
  async hasRelationship({ profissionalId, pacienteId }) {
    return this.appointments.all().some((a) => a.profissionalId === profissionalId
      && a.pacienteId === pacienteId && a.status !== Status.CANCELADA);
  }

  async #own(actor, id) {
    const appt = this.appointments.findById(id);
    if (!appt) throw notFound('Consulta inexistente');
    if (actor.role === 'paciente' && actor.subjectId !== appt.pacienteId) await this.auth.deny(actor, id, 'consulta de outro paciente');
    if (actor.role === 'profissional' && actor.subjectId !== appt.profissionalId) await this.auth.deny(actor, id, 'consulta de outro profissional');
    return appt;
  }

  async #assertHabitual(profissionalId, inicio, fim) {
    const habituais = await this.professionals.habitualSlots(profissionalId, inicio.slice(0, 10));
    if (!habituais.some((s) => s.inicio === inicio && s.fim === fim)) throw validation('Horário fora do atendimento habitual do profissional');
    if (new Date(inicio) <= this.clock()) throw validation('Horário no passado');
  }

  #emit(name, actor, a) { // eventos carregam apenas identificadores e horário — nunca dados clínicos
    return this.bus.publish({ name, ator: actor.accountId, recurso: a.id, resultado: 'OK',
      pacienteId: a.pacienteId, inicio: a.inicio });
  }
}
