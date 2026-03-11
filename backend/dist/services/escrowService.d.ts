/**
 * Escrow service — not yet implemented.
 * These stubs are intentionally empty; payment processing will be added in a future release.
 */
export declare const fundEscrow: (_contractId: string, _amount: number, _actorId: string) => Promise<void>;
export declare const releaseMilestone: (_contractId: string, _milestoneId: string, _actorId: string) => Promise<void>;
export declare const refundEscrow: (_contractId: string, _amount: number, _actorId: string) => Promise<void>;
