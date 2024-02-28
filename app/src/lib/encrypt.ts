import bcrypt from 'bcrypt';

export async function encryptString(value: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(value, salt);
}
