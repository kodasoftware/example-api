import type { Middleware } from '@kodasoftware/api';

import {
  type Account,
  type AccountService,
  type Auth,
  type Database,
  getStatusForError,
  type SerializedAccount,
  type UserService,
} from '../../lib';

export const createMyAccountMiddleware: Middleware<
  SerializedAccount,
  { account: AccountService; user: UserService; db: Database },
  { auth: Auth }
> = async ctx => {
  const { name } = ctx.request.body;

  await ctx.services.db
    .transaction<Account>(async trx => {
      // Check the user does not already have an existing account
      const existing = await ctx.services.account.getMyAccount(ctx.state.auth)(
        trx
      );
      if (existing) ctx.throw(409, 'Account already exists for this user');

      // Check the user exists and doesn't already have an account
      const user = await ctx.services.user.getMe(ctx.state.auth)(trx);
      if (!user) ctx.throw(404, 'User does not exist');
      if (user.account_id) ctx.throw(409, 'User already has an account');

      // Create an account and associate to the user
      const account = await ctx.services.account.createAccount({ name })(trx);
      await ctx.services.user.updateMe(ctx.state.auth, {
        account_id: account.id,
      })(trx);

      ctx.body = account.serialize();
      ctx.status = 201;
    })
    .catch(error => {
      ctx.throw(getStatusForError(error), error.message);
    });
};
