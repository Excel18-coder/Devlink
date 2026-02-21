/**
 * Escrow service — not yet implemented.
 * These stubs are intentionally empty; payment processing will be added in a future release.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fundEscrow = async (_contractId: string, _amount: number, _actorId: string): Promise<void> => {
  throw new Error("Escrow payments are not yet available.");
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const releaseMilestone = async (_contractId: string, _milestoneId: string, _actorId: string): Promise<void> => {
  throw new Error("Escrow payments are not yet available.");
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const refundEscrow = async (_contractId: string, _amount: number, _actorId: string): Promise<void> => {
  throw new Error("Escrow payments are not yet available.");
};
