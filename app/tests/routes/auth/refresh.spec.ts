/* eslint-disable node/no-unpublished-import */
import { MockJwks } from '@kodasoftware/testing';
import { Chance } from 'chance';
import cookie from 'cookie';
import request from 'supertest';

import { applicationFactory, config, User } from '@/lib';
import { authRouteFactory } from '@/routes/auth';

import { generateJwt } from '../../mocks/jwt';

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

describe('GET /auth', () => {
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

  describe('Given an invalid refresh token', () => {
    it('Then returns 401', async () => {
      const { privateKey } = JWKS_CLIENT.generateKeys();
      const refreshToken = await generateJwt(
        { id: unknownUser.id },
        privateKey,
        100
      );
      await expect(
        request(APP.callback())
          .get('/auth')
          .set('Cookie', [
            cookie.serialize('refreshToken', refreshToken, {
              httpOnly: true,
              sameSite: true,
            }),
          ])
      ).resolves.toEqual(expect.objectContaining({ status: 401 }));
    });
  });

  describe('Given an unknown user credentials', () => {
    it('Then should return 401', async () => {
      const refreshToken = await generateJwt(
        { id: unknownUser.id },
        PRIVATE_KEY,
        100
      );

      const response = await request(APP.callback())
        .get('/auth')
        .set('Cookie', [
          cookie.serialize('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: true,
          }),
        ]);

      expect(response).toEqual(expect.objectContaining({ status: 401 }));
      expect(response.headers).toHaveProperty('set-cookie');
      expect(response.headers['set-cookie'][0]).toEqual(
        expect.stringMatching(
          /^refreshToken=; path=\/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict; httponly$/
        )
      );
    });
  });

  describe('Given an inactive user credentials', () => {
    it('Then should return 401', async () => {
      const refreshToken = await generateJwt(
        { id: inactiveUser.id },
        PRIVATE_KEY,
        100
      );

      const response = await request(APP.callback())
        .get('/auth')
        .set('Cookie', [
          cookie.serialize('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: true,
          }),
        ]);

      expect(response).toEqual(expect.objectContaining({ status: 401 }));
      expect(response.headers).toHaveProperty('set-cookie');
      expect(response.headers['set-cookie'][0]).toEqual(
        expect.stringMatching(
          /^refreshToken=; path=\/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict; httponly$/
        )
      );
    });
  });

  describe('Given an active user credentials', () => {
    it('Then should return 200 and issue JWTs', async () => {
      const refreshToken = await generateJwt(
        { id: activeUser.id },
        PRIVATE_KEY,
        100
      );

      const response = await request(APP.callback())
        .get('/auth')
        .set('Cookie', [
          cookie.serialize('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: true,
          }),
        ]);

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
