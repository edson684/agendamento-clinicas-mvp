/** Adaptador de canal (e-mail/SMS) simulado: guarda as mensagens enviadas. Troque por um provedor real aqui. */
export class RecordingChannel {
  constructor() { this.sent = []; }
  async send({ para, texto }) { this.sent.push({ para, texto }); return { ok: true }; }
}
