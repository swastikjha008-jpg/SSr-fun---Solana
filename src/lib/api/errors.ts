export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "FORBIDDEN_ORIGIN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR"
  | (string & {});

export interface ErrorDetail {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: ErrorDetail[],
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string, details?: ErrorDetail[]) =>
  new ApiError(400, "VALIDATION_ERROR", message, details);
export const unauthorized = (message = "Authentication required") => new ApiError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "Forbidden", code: ErrorCode = "FORBIDDEN") => new ApiError(403, code, message);
export const notFound = (what = "Resource") => new ApiError(404, "NOT_FOUND", `${what} not found`);
export const conflict = (message: string, code: ErrorCode = "CONFLICT") => new ApiError(409, code, message);
export const unprocessable = (code: ErrorCode, message: string, details?: ErrorDetail[]) =>
  new ApiError(422, code, message, details);
export const tooManyRequests = (retryAfterSeconds: number) =>
  new ApiError(429, "RATE_LIMITED", "Too many attempts. Try again later.", undefined, {
    "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))),
  });
