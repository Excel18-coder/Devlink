/**
 * Wraps an async Express route handler so that any unhandled rejection is
 * forwarded to Express's `next(err)` error handler instead of crashing the
 * process. Required for all async handlers in Express 4.
 *
 * @example
 * router.get("/", asyncHandler(async (req, res) => { ... }));
 * router.post("/", requireAuth, asyncHandler<AuthRequest>(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
