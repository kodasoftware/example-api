import type { Middleware } from '@kodasoftware/api';

import {
  type Account,
  type AccountService,
  type Auth,
  type Database,
  getStatusForError,
  type SerializedAccount,
} from '../../lib';

export const updateMyAccountMiddleware: Middleware<
  SerializedAccount,
  { account: AccountService; db: Database },
  { auth: Auth }
> = async ctx => {
  const { name } = ctx.request.body;

  await ctx.services.db
    .transaction<Account>(async trx => {
      const existing = await ctx.services.account.getMyAccount(ctx.state.auth)(
        trx
      );
      if (existing && existing.deleted) ctx.throw(404, 'Account not found');

      const account = await ctx.services.account.updateMyAccount(
        ctx.state.auth,
        { name }
      )(trx);
      ctx.body = account.serialize();
      ctx.status = 200;
    })
    .catch(error => {
      ctx.throw(getStatusForError(error), error.message);
    });
};
