interface LogParams {
    actorId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
}
export declare const createAuditLog: (p: LogParams) => Promise<void>;
export {};
