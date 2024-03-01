import { authRouteFactory } from './routes/auth';
import { applicationFactory, config } from './lib';
import { accountRouteFactory, meRouteFactory } from './routes';

export const application = applicationFactory(config);

application.use(
  authRouteFactory({
    accessToken: { expiry: config.cookie.access.expiry },
    refreshToken: { expiry: config.cookie.refresh.expiry },
  }).attach()
);
application.use(
  accountRouteFactory({ publicKey: config.jwks.publicKey }).attach()
);
application.use(meRouteFactory({ publicKey: config.jwks.publicKey }).attach());
