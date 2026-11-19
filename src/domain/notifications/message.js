// Minimização de dados: textos discretos, sem especialidade, diagnóstico ou histórico.
export const Channels = Object.freeze({ EMAIL: 'EMAIL', SMS: 'SMS' });
export const DeliveryStatus = Object.freeze({ PENDENTE: 'PENDENTE', ENVIADA: 'ENVIADA', FALHA: 'FALHA' });
const when = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)} às ${iso.slice(11, 16)}`;
const TEMPLATES = {
  AppointmentCreated: (i) => `Sua consulta foi agendada para ${when(i)}. Detalhes no portal.`,
  AppointmentConfirmed: (i) => `Sua consulta de ${when(i)} foi confirmada.`,
  AppointmentCancelled: (i) => `Sua consulta de ${when(i)} foi cancelada.`,
  AppointmentRescheduled: (i) => `Sua consulta foi remarcada para ${when(i)}. Detalhes no portal.`,
};
export const buildMessage = (eventName, inicio) => TEMPLATES[eventName]?.(inicio) ?? null;
