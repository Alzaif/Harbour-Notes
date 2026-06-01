/** Gateway identity headers (Harbour Phase 1.2). Trust only behind Traefik ForwardAuth. */
export const GATEWAY_HEADERS = {
  userId: 'X-Harbour-User-Id',
  email: 'X-Harbour-Email',
  scopes: 'X-Harbour-Scopes',
  displayName: 'X-Harbour-Display-Name',
} as const;

export interface GatewayIdentity {
  readonly userId: string;
  readonly email: string;
  readonly scopes: string;
  readonly displayName?: string;
}
