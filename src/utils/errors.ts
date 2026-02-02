// Backend uses many string error codes across modules; keep it flexible for API clients.
export type ErrorCode = string;

export function err(res: any, code: ErrorCode, status = 400) {
  return res.status(status).json({ ok: false, error: code });
}
