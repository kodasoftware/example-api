import type { Logger } from '@kodasoftware/monitoring';
import type { Knex as Client } from 'knex';
import Knex from 'knex';

type ConnectionConfig =
  | {
      user: string;
      password: string;
      database: string;
      port: string;
      host: string;
    }
  | { filename: string };

export interface DatabaseConfig {
  driver: 'sqlite3' | 'pg';
  connection: ConnectionConfig;
  log?: Logger;
  pool?: {
    min?: number;
    max?: number;
  };
}

export class Database {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly client: Client;
  constructor(config: DatabaseConfig) {
    this.client = Knex({
      client: config.driver,
      jsonbSupport: true,
      connection: config.connection,
      log: config.log,
      pool: config.pool,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public transaction<T extends {} = {}>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (trx: Client.Transaction) => Promise<any>
  ): Promise<T> {
    return this.client.transaction(trx => {
      callback(trx).then(trx.commit).catch(trx.rollback);
    });
  }

  public get connection() {
    return this.client;
  }

  public get destroy() {
    return this.client.destroy();
  }
}
