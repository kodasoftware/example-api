import { createApplication, generateSwaggerSpec } from '@kodasoftware/api';
import type { LogLevel } from '@kodasoftware/monitoring';

import { Database, type DatabaseConfig } from './database';
import {
  AccountService,
  AuthService,
  JwtService,
  UserService,
} from './service';

type Config = {
  hostname: string;
  app: { name: string; version: string };
  cookie: {
    keys: string[];
    access: { expiry: number };
    refresh: { expiry: number };
  };
  database: DatabaseConfig;
  log: { level: LogLevel };
  cors?: { origin?: string };
  jwks: { privateKey: string; publicKey: string };
};

export function applicationFactory(config: Config) {
  const application = createApplication({
    config: {
      name: config.hostname,
      logLevel: config.log.level,
      services: {
        account: new AccountService(),
        auth: new AuthService(),
        db: new Database(config.database),
        jwt: new JwtService(config.jwks.privateKey, config.jwks.publicKey, {
          accessToken: { expiry: config.cookie.access.expiry },
          refreshToken: { expiry: config.cookie.refresh.expiry },
        }),
        user: new UserService(),
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
  return application;
}
