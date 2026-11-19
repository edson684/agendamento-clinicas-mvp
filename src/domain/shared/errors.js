export const Errors = Object.freeze({
  VALIDATION: 'VALIDATION', FORBIDDEN: 'FORBIDDEN', NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT', UNAUTHENTICATED: 'UNAUTHENTICATED',
});
export class DomainError extends Error {
  constructor(code, message) { super(message); this.name = 'DomainError'; this.code = code; }
}
export const validation = (m) => new DomainError(Errors.VALIDATION, m);
export const forbidden = (m) => new DomainError(Errors.FORBIDDEN, m);
export const notFound = (m) => new DomainError(Errors.NOT_FOUND, m);
export const conflict = (m) => new DomainError(Errors.CONFLICT, m);
export const unauthenticated = (m) => new DomainError(Errors.UNAUTHENTICATED, m);
