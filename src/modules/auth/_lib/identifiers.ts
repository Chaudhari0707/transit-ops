export function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

export function isSignInInputEmpty(username: string, password: string) {
  return normalizeIdentifier(username).length === 0 || password.trim().length === 0;
}
