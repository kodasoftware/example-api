import { randomUUID } from 'crypto';
import type { Knex } from 'knex';

import { Account, type Auth } from '../database';

import { NoAccountError } from './errors';

export class AccountService {
  public createAccount({ name }: { name: string }) {
    return async (trx: Knex<Account> | Knex.Transaction<Account>) => {
      const account = new Account(
        name,
        false,
        randomUUID(),
        new Date(),
        new Date()
      );
      return await account.save(trx);
    };
  }

  public getMyAccount(auth: Auth) {
    return async (
      knex: Knex<Account> | Knex.Transaction<Account>
    ): Promise<Account> => {
      const account = await Account.getAccountByUserId(auth.id, knex);
      if (!account) throw new NoAccountError('No account found');
      return account;
    };
  }

  public updateMyAccount(
    auth: Auth,
    account: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>
  ) {
    return async (knex: Knex | Knex.Transaction): Promise<Account> => {
      const _account = await Account.getAccountByUserId(auth.id, knex);
      if (!_account) throw new NoAccountError('No account found');
      if (!account.name && !account.deleted) return _account;
      if (account.name) _account.name = account.name;
      if (account.deleted) _account.deleted = account.deleted;
      return await _account.save(knex);
    };
  }

  public deleteMyAccount(auth: Auth) {
    return async (knex: Knex | Knex.Transaction): Promise<void> => {
      const account = await Account.getAccountByUserId(auth.id, knex);
      if (!account) throw new NoAccountError('No account found');
      await account.delete(knex);
    };
  }
}
