/* eslint-disable node/no-unpublished-import */
import { MockJwks } from '@kodasoftware/testing';
import { Chance } from 'chance';
import request from 'supertest';

import {
  Account,
  applicationFactory,
  Auth,
  config,
  JwtService,
  User,
} from '@/lib';
import { accountRouteFactory } from '@/routes/account';

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
APP.use(accountRouteFactory({ publicKey: PUBLIC_KEY }).attach());

jest.useFakeTimers({ now: NOW });

describe('GET /accounts', () => {
  const account = new Account(CHANCE.company(), false);
  const deletedAccount = new Account(CHANCE.company(), true);
  const password = CHANCE.string();
  const userWithAccount = new User(
    CHANCE.email(),
    password,
    CHANCE.name(),
    false,
    CHANCE.guid(),
    account.id
  );
  const userWithoutAccount = new User(
    CHANCE.email(),
    password,
    CHANCE.name(),
    false,
    CHANCE.guid()
  );
  const userWithDeletedAccount = new User(
    CHANCE.email(),
    password,
    CHANCE.name(),
    false,
    CHANCE.guid(),
    deletedAccount.id
  );
  const unknownUser = new User(CHANCE.email(), password, CHANCE.name(), false);

  beforeEach(async () => {
    await account.save(APP.context.services.db.connection);
    await deletedAccount.save(APP.context.services.db.connection);
    await userWithAccount.save(APP.context.services.db.connection);
    await userWithoutAccount.save(APP.context.services.db.connection);
    await userWithDeletedAccount.save(APP.context.services.db.connection);
  });

  afterEach(async () => {
    await APP.context.services.db.connection('user_accounts').delete();
    await APP.context.services.db.connection('accounts').delete();
    await APP.context.services.db.connection('users').delete();
  });

  afterAll(async () => {
    await APP.context.services.db.destroy;
  });

  describe('Given an invalid JWT', () => {
    it.each([
      generateJwt(
        new Auth(userWithAccount.id, userWithAccount.email, ['READ'])
          .jwtPayload,
        JWKS_CLIENT.generateKeys().privateKey,
        100
      ),
      CHANCE.word(),
    ])('Then returns 401', async token => {
      await expect(
        request(APP.callback())
          .get('/accounts')
          .set('Authorization', `Bearer ${token}`)
      ).resolves.toEqual(expect.objectContaining({ status: 401 }));
    });
  });

  describe('Given auth lacks permissions', () => {
    it('Then returns 401', async () => {
      const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
        new Auth(userWithAccount.id, userWithAccount.email, [])
      );

      await expect(
        request(APP.callback())
          .get('/accounts')
          .set('Authorization', `Bearer ${accessToken}`)
      ).resolves.toEqual(expect.objectContaining({ status: 401 }));
    });
  });

  describe('Given a user that does not exist', () => {
    describe('When the user executes get my account', () => {
      it('Then return 401', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(unknownUser.id, unknownUser.email, ['WRITE'])
        );

        await expect(
          request(APP.callback())
            .get('/accounts')
            .set('Authorization', `Bearer ${accessToken}`)
        ).resolves.toEqual(expect.objectContaining({ status: 401 }));
      });
    });
  });

  describe('Given a user without an account', () => {
    describe('When the user executes get my account', () => {
      it('Then return 404', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(userWithoutAccount.id, userWithoutAccount.email, ['READ'])
        );

        await expect(
          request(APP.callback())
            .get('/accounts')
            .set('Authorization', `Bearer ${accessToken}`)
        ).resolves.toEqual(expect.objectContaining({ status: 404 }));
      });
    });
  });

  describe('Given a user with a deleted account', () => {
    describe('When the user executes get my account', () => {
      it('Then return 404', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(userWithDeletedAccount.id, userWithDeletedAccount.email, [
            'READ',
          ])
        );

        await expect(
          request(APP.callback())
            .get('/accounts')
            .set('Authorization', `Bearer ${accessToken}`)
        ).resolves.toEqual(expect.objectContaining({ status: 404 }));
      });
    });
  });

  describe('Given a user with an account', () => {
    describe('When the user executes get my account', () => {
      it('Then return 200 and account', async () => {
        const { accessToken } = await JWT_SERVICE.getJwtFromAuth(
          new Auth(userWithAccount.id, userWithAccount.email, ['READ'])
        );

        const response = await request(APP.callback())
          .get('/accounts')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response).toEqual(expect.objectContaining({ status: 200 }));
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', account.name);
        expect(response.body).toHaveProperty('deleted', false);
        expect(response.body).toHaveProperty('created_at', NOW.toISOString());
        expect(response.body).toHaveProperty('updated_at', NOW.toISOString());
      });
    });
  });
});
