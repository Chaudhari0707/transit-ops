const PASSWORD_HASH_OPTIONS = {
  algorithm: "argon2id",
  memoryCost: 65536,
  timeCost: 3,
} as const;

export async function hashPassword(password: string) {
  return Bun.password.hash(password, PASSWORD_HASH_OPTIONS);
}

export async function verifyPassword(data: { password: string; hash: string }) {
  return Bun.password.verify(data.password, data.hash);
}
