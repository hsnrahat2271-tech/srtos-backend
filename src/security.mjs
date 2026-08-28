import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'srtos_session';

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
export function issueSession(user, secret, hours = 2) {
  return jwt.sign({ sub: String(user.id), email: user.email, typ: 'session' }, secret, {
    expiresIn: `${hours}h`,
    issuer: 'srtos-qld-a3',
    audience: 'srtos-qld-web'
  });
}
export function verifySession(token, secret) {
  const payload = jwt.verify(token, secret, { issuer: 'srtos-qld-a3', audience: 'srtos-qld-web' });
  if (payload.typ !== 'session') throw new Error('Invalid session type');
  return { id: Number(payload.sub), email: payload.email };
}
export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}
export function sessionCookie(token, { production = false, maxAgeSeconds = 7200 } = {}) {
  const attrs = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    production ? 'SameSite=None' : 'SameSite=Lax'
  ];
  if (production) attrs.push('Secure');
  return attrs.join('; ');
}
export function clearSessionCookie({ production = false } = {}) {
  const attrs = [`${COOKIE_NAME}=`, 'HttpOnly', 'Path=/', 'Max-Age=0', production ? 'SameSite=None' : 'SameSite=Lax'];
  if (production) attrs.push('Secure');
  return attrs.join('; ');
}
