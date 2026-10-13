export const ORDER_ID = '58309'
export const UPDATE_SQL = `UPDATE orders SET status = 'refunded' WHERE id = ${ORDER_ID}`

export const APPROVAL_STEP = 4
export const RUN_PRESS_STEP = 5
export const UPDATED_STEP = 6
export const DONE_STEP = 7
