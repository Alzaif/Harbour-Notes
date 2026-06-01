import type { MessageBusPort } from '../../domain/ports/message-bus.port';

type Handler = (message: { type: string }) => void | Promise<void>;

/** Dev/test adapter; replace with broker-backed bus in production when needed. */
export class InMemoryMessageBus implements MessageBusPort {
  private readonly handlers = new Map<string, Set<Handler>>();

  async publish<T extends { type: string }>(message: T): Promise<void> {
    const set = this.handlers.get(message.type);
    if (!set) return;
    await Promise.all([...set].map((h) => h(message)));
  }

  subscribe<T extends { type: string }>(
    type: T['type'],
    handler: (message: T) => void | Promise<void>,
  ): () => void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as Handler);
    this.handlers.set(type, set);
    return () => set.delete(handler as Handler);
  }
}
