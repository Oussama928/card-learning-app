import type { Pool, QueryResult } from "pg";

type ExtendedPool = Pool & {
  queryAsync: (sql: string, values?: unknown[]) => Promise<QueryResult<any>>;
};

declare const db: ExtendedPool;

export default db;
