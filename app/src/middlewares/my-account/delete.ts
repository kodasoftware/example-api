import type { Middleware } from '@kodasoftware/api';

import {
  type AccountService,
  type Auth,
  type Database,
  getStatusForError,
  type SerializedAccount,
} from '../../lib';

export const deleteMyAccountMiddleware: Middleware<
  SerializedAccount,
  { account: AccountService; db: Database },
  { auth: Auth }
> = async ctx => {
  await ctx.services.db
    .transaction(async trx => {
      await ctx.services.account.deleteMyAccount(ctx.state.auth)(trx);
      ctx.status = 200;
    })
    .catch(error => {
      ctx.throw(getStatusForError(error), error.message);
    });
};
