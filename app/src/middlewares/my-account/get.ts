import type { Middleware } from '@kodasoftware/api';

import {
  type AccountService,
  type Auth,
  type Database,
  getStatusForError,
  type SerializedAccount,
} from '../../lib';

export const getMyAccountMiddleware: Middleware<
  SerializedAccount,
  { account: AccountService; db: Database },
  { auth: Auth }
> = async ctx => {
  await ctx.services.account
    .getMyAccount(ctx.state.auth)(ctx.services.db.connection)
    .then(account => {
      ctx.body = account.serialize();
      ctx.status = 200;
    })
    .catch(error => {
      ctx.throw(getStatusForError(error), error.message);
    });
};
