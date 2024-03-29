import type { Knex } from 'knex';

import type { AccountRecord, UserRecord } from './';

export interface Record {
  created_at: string;
  updated_at: string;
}

declare module 'knex/types/tables' {
  interface Tables {
    accounts: Knex.CompositeTableType<
      AccountRecord,
      AccountRecord,
      Partial<Pick<AccountRecord, 'deleted' | 'updated_at' | 'name'>>,
      Omit<AccountRecord, 'id' | 'created_at'>
    >;
    users: Knex.CompositeTableType<
      UserRecord,
      UserRecord,
      Partial<
        Pick<
          UserRecord,
          'deleted' | 'updated_at' | 'name' | 'email' | 'password'
        >
      >,
      Omit<UserRecord, 'id' | 'created_at'>
    >;
    user_accounts: Knex.CompositeTableType<
      { user_id: string; account_id: string },
      { user_id: string; account_id: string },
      { user_id: string; account_id: string },
      { user_id: string; account_id: string }
    >;
  }
}
