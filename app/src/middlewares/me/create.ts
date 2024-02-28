import type { Middleware } from '@kodasoftware/api';

import {
  type Auth,
  type Database,
  getStatusForError,
  type SerializedUser,
  type User,
  type UserService,
} from '../../lib';

export const createMeMiddleware: Middleware<
  SerializedUser,
  { user: UserService; db: Database },
  { auth: Auth }
> = async ctx => {
  const { email, password, name } = ctx.request.body;
  await ctx.services.db
    .transaction<User>(async trx => {
      const user = await ctx.services.user.createUser({
        email,
        password,
        account_id: null,
        name,
      })(trx);
      ctx.body = user.serialise();
      ctx.status = 201;
    })
    .catch(error => {
      ctx.throw(getStatusForError(error), error?.message);
    });
};
