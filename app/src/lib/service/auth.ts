import bcrypt from 'bcrypt';
import type { Knex } from 'knex';

import {
  Auth,
  InvalidAuthError,
  NoUserError,
  User,
  UserDeletedError,
} from '../../lib';

export class AuthService {
  public getAuthFromEmailPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    return async (knex: Knex | Knex.Transaction): Promise<Auth> => {
      const user = await User.getUserByEmail(email, knex);
      if (!user) throw new NoUserError('User not found');
      if (user.deleted) throw new UserDeletedError('User is deleted');

      const valid = await bcrypt
        .compare(password, user.password)
        .catch(() => false);
      if (!valid) throw new InvalidAuthError('Email/password does not match');

      return Auth.getAuthFromUser(user);
    };
  }
}
