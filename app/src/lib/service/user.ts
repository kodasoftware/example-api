import { randomUUID } from 'crypto';
import type { Knex } from 'knex';

import { type Auth, User } from '../database';
import { encryptString } from '../encrypt';

import { NoAccountError, NoUserError, UserExistsError } from './errors';

export class UserService {
  public createUser({
    account_id,
    email,
    password,
    name,
  }: Pick<User, 'account_id' | 'email' | 'password' | 'name'>) {
    return async (knex: Knex | Knex.Transaction): Promise<User> => {
      const existing = await User.getUserByEmail(email, knex);
      if (existing) throw new UserExistsError('User already exists');
      const user = new User(
        email,
        await encryptString(password),
        name,
        false,
        randomUUID(),
        account_id
      );
      return await user.save(knex);
    };
  }

  public getMe(auth: Auth) {
    return async (knex: Knex | Knex.Transaction): Promise<User> => {
      const user = await User.getUserById(auth.id, knex);
      if (!user) throw new NoUserError('User does not exist');
      return user;
    };
  }

  public updateMe(
    auth: Auth,
    user: Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'deleted'>>
  ) {
    return async (knex: Knex | Knex.Transaction): Promise<User> => {
      let _user = await User.getUserById(auth.id, knex);
      if (!_user || _user.deleted) throw new NoUserError('User not found');
      if (user.account_id) _user.account_id = user.account_id;
      if (user.email) _user.email = user.email;
      if (user.name) _user.name = user.name;
      if (user.password) _user = await _user.setPassword(user.password, knex);
      return await _user.save(knex);
    };
  }

  public deleteMe(auth: Auth) {
    return async (knex: Knex | Knex.Transaction) => {
      const user = await User.getUserById(auth.id, knex);
      if (!user) throw new NoAccountError('Account not found');
      await user.delete(knex);
    };
  }
}
