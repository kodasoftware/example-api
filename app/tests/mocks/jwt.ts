// eslint-disable-next-line node/no-extraneous-import
import { sign } from 'jsonwebtoken';

export function generateJwt(
  payload: string | object,
  privateKey: string,
  expiry: number
) {
  return sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: expiry,
  });
}
