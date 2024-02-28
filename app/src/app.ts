import { authRouteFactory } from './routes/auth';
import { applicationFactory, config } from './lib';
import { accountRouteFactory, meRouteFactory } from './routes';

const JWKS_CONFIG = {
  jwksUri: config.jwks.uri,
  cache: config.jwks.cache,
};

export const application = applicationFactory(config);

application.use(
  authRouteFactory({
    ...JWKS_CONFIG,
    accessToken: { expiry: config.cookie.access.expiry },
    refreshToken: { expiry: config.cookie.refresh.expiry },
  }).attach()
);
application.use(accountRouteFactory(JWKS_CONFIG).attach());
application.use(meRouteFactory(JWKS_CONFIG).attach());
