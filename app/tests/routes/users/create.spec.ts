/* eslint-disable node/no-unpublished-import */
import { MockJwks } from '@kodasoftware/testing';
import { Chance } from 'chance';
import request from 'supertest';

import { applicationFactory, config, User } from '@/lib';
import { meRouteFactory } from '@/routes/me';

const NOW = new Date();
const CHANCE = new Chance();
const JWKS_CLIENT = new MockJwks({});
const { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY } =
  JWKS_CLIENT.generateKeys();
const APP = applicationFactory({
  ...config,
  jwks: { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY },
});
APP.use(meRouteFactory({ publicKey: PUBLIC_KEY }).attach());

jest.useFakeTimers({ now: NOW });

describe('POST /users', () => {
  const activeuser = new User(
    CHANCE.email(),
    CHANCE.string(),
    CHANCE.name(),
    false,
    CHANCE.guid()
  );

  beforeEach(async () => {
    await activeuser.save(APP.context.services.db.connection);
  });

  afterEach(async () => {
    await APP.context.services.db.connection('users').delete();
  });

  afterAll(async () => {
    await APP.context.services.db.destroy;
  });

  describe.each([
    {},
    { email: CHANCE.email() },
    { password: CHANCE.string({ length: 15 }) },
    { name: CHANCE.name() },
    {
      email: CHANCE.natural(),
      password: CHANCE.string({ length: 15 }),
      name: CHANCE.name(),
    },
    {
      email: CHANCE.string(),
      password: CHANCE.string({ length: 15 }),
      name: CHANCE.name(),
    },
    { email: CHANCE.email(), password: CHANCE.bool(), name: CHANCE.name() },
    { email: CHANCE.email(), password: CHANCE.natural(), name: CHANCE.name() },
    {
      email: CHANCE.email(),
      password: CHANCE.string({ length: 15 }),
      name: CHANCE.bool(),
    },
    {
      email: CHANCE.email(),
      password: CHANCE.string({ length: 15 }),
      name: CHANCE.natural(),
    },
  ])('Given an invalid request body', payload => {
    it('Then should return 400', async () => {
      await expect(
        request(APP.callback()).post('/users').send(payload)
      ).resolves.toEqual(expect.objectContaining({ status: 400 }));
    });
  });

  describe('Given an email that already exists', () => {
    it('Then should return 409', async () => {
      await expect(
        request(APP.callback())
          .post('/users')
          .send({
            email: activeuser.email,
            password: CHANCE.string({ length: 15 }),
            name: CHANCE.name(),
          })
      ).resolves.toEqual(expect.objectContaining({ status: 409 }));
    });
  });

  describe('Given an email that does not already exists', () => {
    it('Then should return 201 and create a user', async () => {
      const email = CHANCE.email();
      const password = CHANCE.string({ length: 15 });
      const name = CHANCE.name();

      const response = await request(APP.callback()).post('/users').send({
        email,
        name,
        password,
      });
      const user = await APP.context.services.db
        .connection('users')
        .where({ email })
        .first();

      expect(response).toEqual(expect.objectContaining({ status: 201 }));
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('account_id', null);
      expect(response.body).toHaveProperty('email', email);
      expect(response.body).toHaveProperty('name', name);
      expect(response.body).toHaveProperty('deleted', false);
      expect(response.body).toHaveProperty('created_at', NOW.toISOString());
      expect(response.body).toHaveProperty('updated_at', NOW.toISOString());
      expect(user).toEqual(expect.objectContaining({ name, deleted: false }));
    });
  });
});
