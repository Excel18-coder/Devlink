import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncFn<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async Express route handler so that any unhandled rejection is
 * forwarded to Express's `next(err)` error handler instead of crashing the
 * process. Required for all async handlers in Express 4.
 *
 * @example
 * router.get("/", asyncHandler(async (req, res) => { ... }));
 * router.post("/", requireAuth, asyncHandler<AuthRequest>(async (req, res) => { ... }));
 */
export const asyncHandler = <T extends Request = Request>(
  fn: AsyncFn<T>
): RequestHandler =>
  (req, res, next): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
