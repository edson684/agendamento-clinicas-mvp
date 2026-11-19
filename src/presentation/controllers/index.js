import { withActor } from './handle.js';
import { authController } from './authController.js';
import { patientController } from './patientController.js';
import { professionalController } from './professionalController.js';
import { appointmentController } from './appointmentController.js';
import { clinicalController } from './clinicalController.js';
import { notificationController } from './notificationController.js';
import { auditController } from './auditController.js';

/** Recebe os casos de uso já montados (injeção de dependências) — não importa nenhum serviço concreto. */
export function createControllers(s) {
  const act = withActor(s.auth);
  return {
    auth: authController({ auth: s.auth }),
    patients: patientController(s.patients, act),
    professionals: professionalController(s.professionals, act),
    appointments: appointmentController(s.appointments, act),
    clinicalRecords: clinicalController(s.clinicalRecords, act),
    notifications: notificationController(s.notifications, act),
    audit: auditController(s.audit, act),
  };
}
