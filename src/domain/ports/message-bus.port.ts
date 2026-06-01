/** Outbound port for publishing and subscribing to messages. */
export interface MessageBusPort {
  publish<T extends { type: string }>(message: T): Promise<void>;
  subscribe<T extends { type: string }>(
    type: T['type'],
    handler: (message: T) => void | Promise<void>,
  ): () => void;
}
