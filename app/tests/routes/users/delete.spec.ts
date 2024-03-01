/* eslint-disable node/no-unpublished-import */
import { MockJwks } from '@kodasoftware/testing';
import { Chance } from 'chance';
import request from 'supertest';

import { applicationFactory, Auth, config, JwtService, User } from '@/lib';
import { meRouteFactory } from '@/routes/me';

import { generateJwt } from '../../mocks/jwt';

const NOW = new Date();
const CHANCE = new Chance();
const JWKS_CLIENT = new MockJwks({});
const { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY } =
  JWKS_CLIENT.generateKeys();
const JWT_SERVICE = new JwtService(PRIVATE_KEY, PUBLIC_KEY, {
  accessToken: { expiry: 100 },
  refreshToken: { expiry: 100 },
});
const APP = applicationFactory({
  ...config,
  jwks: { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY },
});
APP.use(meRouteFactory({ publicKey: PUBLIC_KEY }).attach());

jest.useFakeTimers({ now: NOW });

describe('DELETE /users', () => {
  const activeUser = new User(
    CHANCE.email(),
    CHANCE.string(),
    CHANCE.name(),
    false,
    CHANCE.guid()
  );
  const inactiveUser = new User(
    CHANCE.email(),
    CHANCE.string(),
    CHANCE.name(),
    true,
    CHANCE.guid()
  );
  const unknownUser = new User(
    CHANCE.email(),
    CHANCE.string(),
    CHANCE.name(),
    false,
    CHANCE.guid()
  );

  beforeEach(async () => {
    await activeUser.save(APP.context.services.db.connection);
    await inactiveUser.save(APP.context.services.db.connection);
  });

  afterEach(async () => {
    await APP.context.services.db.connection('users').delete();
  });

  afterAll(async () => {
    await APP.context.services.db.destroy;
  });

  describe('Given an invalid JWT', () => {
    it.each([
      generateJwt(
        new Auth(unknownUser.id, unknownUser.email, ['WRITE']).jwtPayload,
        JWKS_CLIENT.generateKeys().privateKey,
        100
      ),
      CHANCE.word(),
    ])('Then returns 401', async token => {
      await expect(
        request(APP.callback())
          .delete('/users')
          .set('Authorization', `Bearer ${token}`)
      ).resolves.toEqual(expect.objectContaining({ status: 401 }));
    });
  });

  describe('Given auth lacks permissions', () => {
    it('Then returns 401', async () => {
      const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
        new Auth(activeUser.id, activeUser.email, [])
      );

      await expect(
        request(APP.callback())
          .delete('/users')
          .set('Authorization', `Bearer ${accessToken}`)
      ).resolves.toEqual(expect.objectContaining({ status: 401 }));
    });
  });

  describe('Given a user that does not exist', () => {
    describe('When the user executes delete user', () => {
      it('Then return 404 and no user is deleted', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(unknownUser.id, unknownUser.email, ['WRITE'])
        );

        await expect(
          request(APP.callback())
            .delete('/users')
            .set('Authorization', `Bearer ${accessToken}`)
        ).resolves.toEqual(expect.objectContaining({ status: 404 }));
      });
    });
  });

  describe('Given an inactive user', () => {
    describe('When the user executes delete user', () => {
      it('Then return 200 and user is deleted', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(inactiveUser.id, inactiveUser.email, ['WRITE'])
        );

        const user = await APP.context.services.db
          .connection('users')
          .where({ email: inactiveUser.email })
          .first();

        await expect(
          request(APP.callback())
            .delete('/users')
            .set('Authorization', `Bearer ${accessToken}`)
        ).resolves.toEqual(expect.objectContaining({ status: 200 }));

        expect(user).toHaveProperty('deleted', true);
      });
    });
  });

  describe('Given an active user', () => {
    describe('When the user executes delete user', () => {
      it('Then return 200 and user is deleted', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(activeUser.id, activeUser.email, ['WRITE'])
        );

        const response = await request(APP.callback())
          .delete('/users')
          .set('Authorization', `Bearer ${accessToken}`);
        const user = await APP.context.services.db
          .connection('users')
          .where({ email: activeUser.email })
          .first();

        expect(response).toEqual(expect.objectContaining({ status: 200 }));
        expect(response.body).toEqual({});
        expect(user).toEqual(expect.objectContaining({ deleted: true }));
      });
    });
  });
});
