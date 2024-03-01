// eslint-disable-next-line node/no-unpublished-import
// import { MockJwks } from '@kodasoftware/testing';
// eslint-disable-next-line node/no-unpublished-import
import Chance from 'chance';

import { config } from '@/lib';
import { Database } from '@/lib/database/connection';
import { encryptString } from '@/lib/encrypt';
import { AuthService } from '@/lib/service/auth';

const CHANCE = new Chance();
// const JWKS = new MockJwks({ uri: CHANCE.url() });
const DB = new Database(config.database);

describe.skip('AuthService', () => {
  describe('Given a private and public key and token expiries', () => {
    // const keys = JWKS.generateKeys();
    // const privateKey = keys.privateKey;
    // const publicKey = keys.publicKey;
    // const expiry = CHANCE.natural({ min: 0, max: 10 });
    const authService = new AuthService();
    const activeAccount = {
      id: CHANCE.guid(),
      name: CHANCE.company(),
      deleted: false,
      created_at: CHANCE.date().toISOString(),
      updated_at: CHANCE.date().toISOString(),
    };
    const inactiveAccount = {
      id: CHANCE.guid(),
      name: CHANCE.company(),
      deleted: true,
      created_at: CHANCE.date().toISOString(),
      updated_at: CHANCE.date().toISOString(),
    };
    const activeUserWithActiveAccount = {
      id: CHANCE.guid(),
      account_id: activeAccount.id,
      email: CHANCE.email(),
      password: CHANCE.string(),
      name: CHANCE.name({ full: true }),
      deleted: false,
      created_at: CHANCE.date().toISOString(),
      updated_at: CHANCE.date().toISOString(),
    };
    const inactiveUserWithActiveAccount = {
      id: CHANCE.guid(),
      account_id: activeAccount.id,
      email: CHANCE.email(),
      password: CHANCE.string(),
      name: CHANCE.name({ full: true }),
      deleted: true,
      created_at: CHANCE.date().toISOString(),
      updated_at: CHANCE.date().toISOString(),
    };
    const activeUserWithInactiveAccount = {
      id: CHANCE.guid(),
      account_id: inactiveAccount.id,
      email: CHANCE.email(),
      password: CHANCE.string(),
      name: CHANCE.name({ full: true }),
      deleted: false,
      created_at: CHANCE.date().toISOString(),
      updated_at: CHANCE.date().toISOString(),
    };
    const inactiveUserWithInactiveAccount = {
      id: CHANCE.guid(),
      account_id: inactiveAccount.id,
      email: CHANCE.email(),
      password: CHANCE.string(),
      name: CHANCE.name({ full: true }),
      deleted: true,
      created_at: CHANCE.date().toISOString(),
      updated_at: CHANCE.date().toISOString(),
    };

    beforeAll(async () => {
      const encryptedUserPasswords = await Promise.all(
        [
          activeUserWithActiveAccount,
          inactiveUserWithActiveAccount,
          activeUserWithInactiveAccount,
          inactiveUserWithInactiveAccount,
        ].map(async u => {
          return {
            ...u,
            password: await encryptString(u.password),
          };
        })
      );
      await DB.connection
        .table('accounts')
        .insert([activeAccount, inactiveAccount]);
      await DB.connection.table('users').insert(encryptedUserPasswords);
    });

    afterAll(async () => {
      await DB.connection.table('users').delete();
      await DB.connection.table('accounts').delete();
      await DB.destroy;
      // return DB.transaction(async trx => {
      // });
    });

    describe('When getAuth is called', () => {
      describe('And an invalid email/password combination is provided', () => {
        it('Then it returns null', async () => {
          const email = CHANCE.email();
          const password = CHANCE.word();
          await expect(
            DB.transaction(
              authService.getAuthFromEmailPassword({ email, password })
            )
          ).resolves.toBeNull();
        });
      });

      describe('And an valid email/password combination is provided', () => {
        it('Then it returns auth', async () => {
          const email = activeUserWithActiveAccount.email;
          const password = activeUserWithActiveAccount.password;
          await expect(
            DB.transaction(
              authService.getAuthFromEmailPassword({ email, password })
            )
          ).resolves.toEqual({
            id: activeUserWithActiveAccount.id,
            permissions: ['READ', 'WRITE'],
          });
        });
      });
    });
  });
});
