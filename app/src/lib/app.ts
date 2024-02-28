import { createApplication, generateSwaggerSpec } from '@kodasoftware/api';
import type { LogLevel } from '@kodasoftware/monitoring';

import type { DatabaseConfig } from '.';
import { AccountService, Database } from '.';

type Config = {
  hostname: string;
  app: { name: string; version: string };
  cookie: { keys: string[] };
  database: DatabaseConfig;
  log: { level: LogLevel };
  cors?: { origin?: string };
};

export function applicationFactory(config: Config) {
  const application = createApplication({
    config: {
      name: config.hostname,
      logLevel: config.log.level,
      services: {
        account: new AccountService(),
        db: new Database(config.database),
        // user: new UserService(),
      },
    },
    cors: { origin: config.cors?.origin },
    koa: {
      keys: config.cookie.keys,
    },
    body: {},
    swagger: {
      spec: generateSwaggerSpec({
        definition: {
          info: {
            title: config.app.name,
            version: config.app.version,
          },
        },
      }),
    },
  });
  application.context.services.db = new Database(config.database);
  return application;
}
