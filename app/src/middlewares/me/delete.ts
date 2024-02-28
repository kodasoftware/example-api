import type { Middleware } from '@kodasoftware/api';

import {
  type Auth,
  type Database,
  getStatusForError,
  type SerializedUser,
  type UserService,
} from '../../lib';

export const deleteMeMiddleware: Middleware<
  SerializedUser,
  { user: UserService; db: Database },
  { auth: Auth }
> = async ctx => {
  await ctx.services.db
    .transaction(async trx => {
      await ctx.services.user.deleteMe(ctx.state.auth)(trx);
      ctx.status = 200;
    })
    .catch(error => {
      ctx.throw(getStatusForError(error), error?.message);
    });
};
