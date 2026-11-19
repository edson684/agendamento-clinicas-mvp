// Manifesto das dependências PERMITIDAS entre os 7 módulos.
// Fonte única usada pela injeção de dependências (main.js) e pelos testes de arquitetura.
export const MODULE_DEPENDENCIES = Object.freeze({
  auth: [],
  patients: ['auth'],
  professionals: ['auth'],
  appointments: ['auth', 'patients', 'professionals'],
  'clinical-records': ['auth', 'patients', 'appointments'],
  notifications: ['auth', 'patients'],
  audit: ['auth'],
});
