import type { User } from './user';

export const DEFAULT_PERMISSIONS = ['READ', 'WRITE'];

export class Auth {
  public static getAuthFromUser(user: User): Auth {
    return this.toAuth(user.id, user.email);
  }

  public static toAuth(
    id: string,
    email: string,
    permissions: string[] = DEFAULT_PERMISSIONS
  ): Auth {
    return new Auth(id, email, permissions);
  }

  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly permissions: string[]
  ) {}

  public get jwtPayload() {
    return {
      id: this.id,
      email: this.email,
      permissions: this.permissions,
    };
  }
}
