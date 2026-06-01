import type { ClockPort } from '../../domain/ports/clock.port.js';

export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }
}
