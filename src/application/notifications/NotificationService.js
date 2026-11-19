import { Events } from '../contracts/events.js';
import { buildMessage, Channels, DeliveryStatus } from '../../domain/notifications/message.js';

const MAX_TRIES = 3;
export class NotificationService {
  constructor({ notifications, auth, patients, channel, bus }) {
    Object.assign(this, { notifications, auth, patients, channel, bus });
  }

  /** Consumidor de eventos de agendamento (assinado em main.js). Não conhece o módulo de Agendamentos. */
  async handle(event) {
    const texto = buildMessage(event.name, event.inicio);
    if (!texto) return null;
    const contato = await this.patients.contactOf(event.pacienteId); // só o contato necessário
    let n = { id: this.notifications.nextId(), pacienteId: event.pacienteId, canal: Channels.SMS,
      texto, status: DeliveryStatus.PENDENTE, tentativas: 0 };
    while (n.status !== DeliveryStatus.ENVIADA && n.tentativas < MAX_TRIES) {
      n = { ...n, tentativas: n.tentativas + 1 };
      const r = await this.channel.send({ para: contato.telefone, texto }).catch(() => ({ ok: false }));
      if (r.ok) n = { ...n, status: DeliveryStatus.ENVIADA };
    }
    if (n.status !== DeliveryStatus.ENVIADA) n = { ...n, status: DeliveryStatus.FALHA };
    this.notifications.save(n);
    await this.bus.publish({ name: n.status === DeliveryStatus.ENVIADA ? Events.NotificationSent : Events.NotificationFailed,
      recurso: n.id, resultado: n.status === DeliveryStatus.ENVIADA ? 'OK' : 'NEGADO' });
    return n;
  }

  async list(actor) {
    await this.auth.authorize(actor, 'notification:own', 'notification:manage');
    return actor.role === 'paciente' ? this.notifications.byPatient(actor.subjectId) : this.notifications.all();
  }
}
