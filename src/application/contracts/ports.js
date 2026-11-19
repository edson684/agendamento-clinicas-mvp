/**
 * Portas (interfaces) que a aplicação espera da infraestrutura. Em JS são contratos documentados;
 * os adaptadores concretos vivem em src/infrastructure e são injetados em src/main.js.
 *
 * @typedef {{ publish(event: object): Promise<object>, subscribe(name: string, handler: Function): void }} EventBus
 * @typedef {{ send(msg: { para: string, texto: string }): Promise<{ ok: boolean }> }} NotificationChannel
 * @typedef {{ hash(senha: string): Promise<string>, verify(senha: string, hash: string): Promise<boolean> }} PasswordHasher
 * @typedef {{ open(actor: object): string, get(token: string): object|null, close(token: string): void }} SessionStore
 * @typedef {{ reserve(a: object): object, move(a: object): object, update(a: object): object,
 *             findById(id: string): object|null, all(): object[], startsOf(profissionalId: string): string[],
 *             nextId(): string }} AppointmentRepository
 */
export {};
