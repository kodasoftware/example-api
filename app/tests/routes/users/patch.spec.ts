/* eslint-disable node/no-unpublished-import */
import { MockJwks } from '@kodasoftware/testing';
import { compare } from 'bcrypt';
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

describe('PATCH /users', () => {
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
          .patch('/users')
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
          .patch('/users')
          .set('Authorization', `Bearer ${accessToken}`)
      ).resolves.toEqual(expect.objectContaining({ status: 401 }));
    });
  });

  describe.each([
    { email: CHANCE.natural() },
    { email: CHANCE.bool() },
    { password: CHANCE.bool() },
    {
      email: CHANCE.natural(),
      password: CHANCE.string({ length: 1 }),
      name: CHANCE.name(),
    },
    {
      email: CHANCE.string(),
      password: CHANCE.string({ length: 5 }),
      name: CHANCE.name(),
    },
    { email: CHANCE.email(), password: CHANCE.bool(), name: CHANCE.name() },
  ])('Given an invalid request body', payload => {
    it('Then should return 400', async () => {
      const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
        new Auth(activeUser.id, activeUser.email, ['WRITE'])
      );

      await expect(
        request(APP.callback())
          .patch('/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(payload)
      ).resolves.toEqual(expect.objectContaining({ status: 400 }));
    });
  });

  describe('Given a user that does not exist', () => {
    describe('When the user executes update user', () => {
      it('Then return 404 and no user is updated', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(unknownUser.id, unknownUser.email, ['WRITE'])
        );

        await expect(
          request(APP.callback())
            .patch('/users')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              email: CHANCE.email(),
              password: CHANCE.string({ length: 15 }),
              name: CHANCE.name(),
            })
        ).resolves.toEqual(expect.objectContaining({ status: 404 }));
      });
    });
  });

  describe('Given an inactive user', () => {
    describe('When the user executes update user', () => {
      it('Then return 404 and user is not updated', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(inactiveUser.id, inactiveUser.email, ['WRITE'])
        );

        await expect(
          request(APP.callback())
            .patch('/users')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              email: CHANCE.email(),
              password: CHANCE.string({ length: 15 }),
              name: CHANCE.name(),
            })
        ).resolves.toEqual(expect.objectContaining({ status: 404 }));
      });
    });
  });

  describe('Given an active user', () => {
    describe('When the user executes update user', () => {
      it('Then return 200 and user is updated', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(activeUser.id, activeUser.email, ['WRITE'])
        );
        const newEmail = CHANCE.email();
        const newPassword = CHANCE.string({ length: 15 });
        const newName = CHANCE.name();

        const response = await request(APP.callback())
          .patch('/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            email: newEmail,
            password: newPassword,
            name: newName,
          });
        const user = await APP.context.services.db
          .connection('users')
          .where({ email: newEmail })
          .first();

        expect(response).toEqual(expect.objectContaining({ status: 200 }));
        expect(response.body).not.toHaveProperty('password');
        expect(response.body).toHaveProperty('id');
        expect(response.body).toEqual(
          expect.objectContaining({
            account_id: null,
            created_at: new Date(user.created_at).toISOString(),
            updated_at: NOW.toISOString(),
            deleted: false,
            name: newName,
          })
        );
        expect(user).toEqual(
          expect.objectContaining({
            name: newName,
          })
        );
        await expect(compare(newPassword, user.password)).resolves.toEqual(
          true
        );
      });
    });
  });
});
