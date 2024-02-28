import { randomUUID } from 'crypto';
import type { Knex } from 'knex';

import type { Record } from '@/lib/database';

import { encryptString } from '../encrypt';

export interface UserRecord extends Record {
  id: string;
  account_id: string | null;
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
    const record = await trx.table('users').where('id', id).first();
    if (!record) return null;
    return this.toUser(record);
  }

  public static async getUserByEmail(
    email: string,
    trx: Knex | Knex.Transaction
  ): Promise<User | null> {
    const record = await trx.table('users').where('email', email).first();
    if (!record) return null;
    return this.toUser(record);
  }

  private static toUser(record: UserRecord): User {
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

  public save(trx: Knex | Knex.Transaction): Promise<User> {
    this.updated_at = new Date();
    return trx
      .table('users')
      .insert(this.toRecord())
      .onConflict('id')
      .merge(['email', 'deleted', 'name', 'account_id', 'updated_at'])
      .first()
      .then(() => this);
  }

  public delete(trx: Knex | Knex.Transaction): Promise<User> {
    this.updated_at = new Date();
    this.deleted = true;
    return trx
      .table('users')
      .insert(this.toRecord())
      .onConflict('id')
      .merge(['email', 'deleted', 'name', 'account_id', 'updated_at'])
      .first()
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
      account_id: this.account_id,
      email: this.email,
      password: this.password,
      name: this.name,
      deleted: this.deleted,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString(),
    };
  }
}
