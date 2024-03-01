/* eslint-disable node/no-unpublished-import */
import { MockJwks } from '@kodasoftware/testing';
import { Chance } from 'chance';
import request from 'supertest';

import { applicationFactory, config, User } from '@/lib';
import { authRouteFactory } from '@/routes/auth';

const NOW = new Date();
const CHANCE = new Chance();
const JWKS_CLIENT = new MockJwks({});
const { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY } =
  JWKS_CLIENT.generateKeys();
const APP = applicationFactory({
  ...config,
  jwks: { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY },
});
APP.use(
  authRouteFactory({
    accessToken: { expiry: config.cookie.access.expiry },
    refreshToken: { expiry: config.cookie.refresh.expiry },
  }).attach()
);

jest.useFakeTimers({ now: NOW });

describe('POST /auth', () => {
  const password = CHANCE.string();
  const activeUser = new User(CHANCE.email(), password, CHANCE.name(), false);
  const inactiveUser = new User(CHANCE.email(), password, CHANCE.name(), true);
  const unknownUser = new User(CHANCE.email(), password, CHANCE.name(), false);

  beforeEach(async () => {
    await activeUser.save(APP.context.services.db.connection);
    await inactiveUser.save(APP.context.services.db.connection);
    await activeUser.setPassword(password, APP.context.services.db.connection);
    await inactiveUser.setPassword(
      password,
      APP.context.services.db.connection
    );
  });

  afterEach(() => APP.context.services.db.connection('users').delete());
  afterAll(() => APP.context.services.db.destroy);

  describe.each([
    { email: CHANCE.email(), password: CHANCE.natural() },
    { email: CHANCE.bool(), password: CHANCE.string() },
    {
      email: CHANCE.pickone([CHANCE.bool(), CHANCE.natural()]),
      password: CHANCE.pickone([CHANCE.bool(), CHANCE.natural()]),
    },
    { foo: CHANCE.email(), bar: CHANCE.string() },
  ])('Given an invalid payload', payload => {
    it('Then returns 400', async () => {
      await expect(
        request(APP.callback()).post('/auth').send(payload)
      ).resolves.toEqual(expect.objectContaining({ status: 400 }));
    });
  });

  describe('Given an unknown user credentials', () => {
    it('Then should return 401', async () => {
      await expect(
        request(APP.callback())
          .post('/auth')
          .send({ email: unknownUser.email, password: unknownUser.password })
      ).resolves.toEqual(expect.objectContaining({ status: 401 }));
    });
  });

  describe('Given an inactive user credentials', () => {
    it('Then should return 401', async () => {
      await expect(
        request(APP.callback())
          .post('/auth')
          .send({ email: inactiveUser.email, password: inactiveUser.password })
      ).resolves.toEqual(expect.objectContaining({ status: 401 }));
    });
  });

  describe('Given an active user credentials', () => {
    it('Then should return 200 and issue JWTs', async () => {
      const response = await request(APP.callback())
        .post('/auth')
        .send({ email: activeUser.email, password });

      expect(response).toEqual(expect.objectContaining({ status: 200 }));
      expect(response.body).toHaveProperty(
        'accessToken',
        expect.stringMatching(/.*/)
      );
      expect(response.body).toHaveProperty(
        'expiry',
        new Date(NOW.getTime() + config.cookie.access.expiry).toISOString()
      );
      expect(response.headers).toHaveProperty('set-cookie');
      expect(response.headers['set-cookie'][0]).toEqual(
        expect.stringMatching(
          /^accessToken=\S+; path=\/; expires=\S+ \d+ \S+ \d+ \d{2}:\d{2}:\d{2} GMT; samesite=strict$/
        )
      );
      expect(response.headers['set-cookie'][2]).toEqual(
        expect.stringMatching(
          /^refreshToken=\S+; path=\/; expires=\S+ \d+ \S+ \d+ \d{2}:\d{2}:\d{2} GMT; samesite=strict; httponly$/
        )
      );
    });
  });
});
