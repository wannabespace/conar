const CONNECTION_FAILURES =
  /err_timed_out|etimedout|enotfound|econnreset|econnrefused|password authentication|client password must be a|no pg_hba\.conf entry for host|could not connect to database/iu

export const isConnectionFailure = (error: Error) =>
  CONNECTION_FAILURES.test(error.message)
