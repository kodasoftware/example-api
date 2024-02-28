// eslint-disable-next-line node/no-extraneous-import
import type Jwt from 'jsonwebtoken';
// eslint-disable-next-line node/no-extraneous-import
import { decode, sign, verify } from 'jsonwebtoken';
import type { Knex } from 'knex';

import { Auth, User } from '../database';

export class JwtService {
  constructor(
    private readonly privateKey: string,
    private readonly publicKey: string,
    private readonly config: {
      accessToken: { expiry: number };
      refreshToken: { expiry: number };
    }
  ) {}

  public async getJwtFromAuth(
    auth: Auth
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await sign(auth, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.config.accessToken.expiry,
    });
    const refreshToken = await sign({ id: auth.id }, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.config.refreshToken.expiry,
    });

    return { accessToken, refreshToken };
  }

  public getJwtFromRefreshToken(
    refreshToken: string
  ): (
    knex: Knex | Knex.Transaction
  ) => Promise<{ accessToken: string; refreshToken: string }> {
    return async knex => {
      const decoded = await this.decodeJwt(refreshToken);
      const verified = this.verifyJwt(refreshToken);

      if (!verified || !decoded) throw new Error('Invalid token provided');

      const userId = decoded.payload.id;
      const user = await User.getUserById(userId, knex);
      if (!user) throw new Error('No user found');
      if (user.deleted) throw new Error('User is deleted');

      const auth = Auth.getAuthFromUser(user);
      return await this.getJwtFromAuth(auth);
    };
  }

  private verifyJwt(refreshToken: string): boolean {
    try {
      const verified = verify(refreshToken, this.publicKey, {
        complete: true,
      });
      return !!verified;
    } catch {
      return false;
    }
  }

  private decodeJwt(token: string) {
    return decode(token, { complete: true }) as
      | (Jwt.Jwt & { payload: Jwt.JwtPayload })
      | null;
  }
}
