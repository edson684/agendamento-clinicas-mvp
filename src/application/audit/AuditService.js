import { Events } from '../contracts/events.js';
import { createRecord } from '../../domain/audit/auditRecord.js';

export class AuditService {
  constructor({ records, auth, bus }) { Object.assign(this, { records, auth, bus }); }

  /** Consumidor de TODOS os eventos: grava só metadados (lista branca). */
  async record(event) { this.records.append(createRecord(event)); }

  async list(actor) {
    await this.auth.authorize(actor, 'audit:read');
    await this.bus.publish({ name: Events.AuditAccessed, ator: actor.accountId, resultado: 'OK' }); // o acesso à auditoria também é auditado
    return this.records.all().reverse();
  }
}
