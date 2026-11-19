// Conascência de NOME centralizada: produtores e consumidores importam os nomes daqui.
const NAMES = ['AccountCreated', 'LoginSucceeded', 'LoginFailed', 'Logout', 'AccessDenied',
  'PatientCreated', 'PatientUpdated', 'ProfessionalCreated', 'ProfessionalScheduleChanged',
  'AppointmentCreated', 'AppointmentConfirmed', 'AppointmentCancelled', 'AppointmentRescheduled',
  'AppointmentCompleted', 'ClinicalRecordViewed', 'ClinicalRecordAdded',
  'NotificationSent', 'NotificationFailed', 'AuditAccessed'];
export const Events = Object.freeze(Object.fromEntries(NAMES.map((n) => [n, n])));
export const NotifiableEvents = Object.freeze([Events.AppointmentCreated, Events.AppointmentConfirmed,
  Events.AppointmentCancelled, Events.AppointmentRescheduled]);
