import { AuthService as AbstractAuthService } from '@kodasoftware/api';
import bcrypt from 'bcrypt';
import type { Knex } from 'knex';

import { Auth, InvalidAuthError, User } from '../../lib';

export class AuthService extends AbstractAuthService<Auth> {
  public isAuthorised(auth: Auth, permission: string): Promise<boolean>;
  public async isAuthorised(): Promise<boolean> {
    return true;
  }

  public getAuthFromEmailPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    return async (knex: Knex | Knex.Transaction): Promise<Auth> => {
      const user = await User.getUserByEmail(email, knex);
      if (!user) throw new InvalidAuthError('User not found');
      if (user.deleted) throw new InvalidAuthError('User is deleted');

      const valid = await bcrypt
        .compare(password, user.password)
        .catch(() => false);
      if (!valid) throw new InvalidAuthError('Email/password does not match');

      return Auth.getAuthFromUser(user);
    };
  }
}
