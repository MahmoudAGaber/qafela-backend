export type ErrorCode =
  | 'NOT_ENOUGH_FUNDS'
  | 'NO_STOCK'
  | 'DROP_OR_ITEM_NOT_AVAILABLE'
  | 'ANTI_HOARDING_LIMIT'
  | 'INVALID_INPUT'
  | 'ITEM_IS_BARTER_ONLY'
  | 'UNAUTHORIZED'
  | 'IDEMPOTENT_REPLAY'
  | 'NOT_FOUND'
  | 'BUY_FAILED'
  | 'OUTPUT_DISABLED'
  | 'TYPE_NOT_FOUND'
  | 'NOT_ENOUGH_ITEMS'
  | 'NOT_ENOUGH_QTY';

export function err(res: any, code: ErrorCode, status = 400) {
  return res.status(status).json({ ok: false, error: code });
}
