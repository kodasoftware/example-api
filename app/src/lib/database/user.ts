import { randomUUID } from 'crypto';
import type { Knex } from 'knex';

import type { Record } from '@/lib/database';

import { encryptString } from '../encrypt';

export interface UserRecord extends Record {
  id: string;
  email: string;
  password: string;
  name: string;
  deleted: boolean;
}

export interface SerializedUser extends Record {
  id: string;
  account_id: string | null;
  email: string;
  name: string;
  deleted: boolean;
}

export class User {
  public static async getUserById(
    id: string,
    trx: Knex | Knex.Transaction
  ): Promise<User | null> {
    const record = await trx
      .table('users')
      .select('users.*', 'user_accounts.account_id')
      .leftJoin('user_accounts', 'user_accounts.user_id', 'users.id')
      .where('id', id)
      .first();
    if (!record) return null;
    return this.toUser(record);
  }

  public static async getUserByEmail(
    email: string,
    trx: Knex | Knex.Transaction
  ): Promise<User | null> {
    const record = await trx
      .table('users')
      .select('users.*', 'user_accounts.account_id')
      .leftJoin('user_accounts', 'user_accounts.user_id', 'users.id')
      .where('email', email)
      .first();
    if (!record) return null;
    return this.toUser(record);
  }

  private static toUser(record: UserRecord & { account_id: string }): User {
    return new User(
      record.email,
      record.password,
      record.name,
      record.deleted,
      record.id,
      record.account_id,
      new Date(record.created_at),
      new Date(record.updated_at)
    );
  }

  constructor(
    public email: string,
    public password: string,
    public name: string,
    public deleted: boolean,
    public id: string = randomUUID(),
    public account_id: string | null = null,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date()
  ) {}

  public async setPassword(
    newPassword: string,
    trx: Knex | Knex.Transaction
  ): Promise<User> {
    const encryptedPassword = await encryptString(newPassword);
    this.password = encryptedPassword;
    return await trx
      .table('users')
      .where('id', this.id)
      .update('password', encryptedPassword)
      .then(() => this);
  }

  public async save(trx: Knex | Knex.Transaction): Promise<User> {
    this.updated_at = new Date();
    await trx
      .table('users')
      .insert(this.toRecord())
      .onConflict('id')
      .merge(['email', 'deleted', 'name', 'updated_at']);

    if (this.account_id) {
      await trx
        .table('user_accounts')
        .insert(
          this.toUserAccountRecord() as { account_id: string; user_id: string }
        )
        .onConflict(['user_id', 'account_id'])
        .merge(['account_id']);
    } else
      await trx.table('user_accounts').where({ user_id: this.id }).delete();

    return this;
  }

  public delete(trx: Knex | Knex.Transaction): Promise<User> {
    this.updated_at = new Date();
    this.deleted = true;

    return trx
      .table('users')
      .insert(this.toRecord())
      .onConflict('id')
      .merge(['email', 'deleted', 'name', 'updated_at'])
      .then(() => this);
  }

  public serialise(): SerializedUser {
    return {
      id: this.id,
      account_id: this.account_id,
      email: this.email,
      name: this.name,
      deleted: this.deleted,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString(),
    };
  }

  private toRecord(): UserRecord {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      name: this.name,
      deleted: this.deleted,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString(),
    };
  }

  private toUserAccountRecord(): {
    user_id: string;
    account_id: string | null;
  } {
    return {
      user_id: this.id,
      account_id: this.account_id,
    };
  }
}
