import bcrypt from 'bcrypt';

export function encryptString(value: string, salt: string): Promise<string> {
  return bcrypt.hash(value, salt);
}
