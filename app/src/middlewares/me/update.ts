import type { Middleware } from '@kodasoftware/api';

import {
  type Auth,
  type Database,
  getStatusForError,
  type SerializedUser,
  type UserService,
} from '../../lib';

export const updateMeMiddleware: Middleware<
  SerializedUser,
  { user: UserService; db: Database },
  { auth: Auth }
> = async ctx => {
  const { name, email, password } = ctx.request.body;

  await ctx.services.db
    .transaction(async trx => {
      const user = await ctx.services.user.updateMe(ctx.state.auth, {
        email,
        name,
        password,
      })(trx);
      ctx.body = user.serialise();
      ctx.status = 200;
    })
    .catch(error => {
      ctx.throw(getStatusForError(error), error?.message);
    });
};
