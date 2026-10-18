import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes recommended for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag

export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Normalizes a 32-byte key from either:
 * - 64-character hex string
 * - 32-character utf-8 string
 * - 32-byte Buffer
 */
export function normalizeEncryptionKey(key?: string | Buffer): Buffer {
  const secretKey = key || process.env.APP_ENCRYPTION_KEY;

  if (!secretKey) {
    throw new EncryptionError(
      'APP_ENCRYPTION_KEY is required for encryption/decryption operations but was not provided or set in environment.'
    );
  }

  if (Buffer.isBuffer(secretKey)) {
    if (secretKey.length !== 32) {
      throw new EncryptionError(
        `Invalid encryption key length: expected 32 bytes, got ${secretKey.length}`
      );
    }
    return secretKey;
  }

  if (typeof secretKey === 'string') {
    // If it's a 64-char hex string, decode as hex
    if (/^[0-9a-fA-F]{64}$/.test(secretKey)) {
      return Buffer.from(secretKey, 'hex');
    }
    // If it's 32 ASCII/UTF-8 chars
    if (Buffer.byteLength(secretKey, 'utf8') === 32) {
      return Buffer.from(secretKey, 'utf8');
    }
  }

  throw new EncryptionError(
    'Invalid APP_ENCRYPTION_KEY format. Must be either a 64-character hex string or 32-byte UTF-8 string.'
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: `iv:authTag:ciphertext` in hex.
 */
export function encrypt(plaintext: string, key?: string | Buffer): string {
  if (typeof plaintext !== 'string') {
    throw new EncryptionError('Plaintext must be a string.');
  }

  const keyBuffer = normalizeEncryptionKey(key);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string created by encrypt().
 * Input format: `iv:authTag:ciphertext` in hex.
 */
export function decrypt(encryptedText: string, key?: string | Buffer): string {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new EncryptionError('Ciphertext string is required for decryption.');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new EncryptionError(
      'Malformed encrypted text format. Expected "iv:authTag:ciphertext".'
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const keyBuffer = normalizeEncryptionKey(key);

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new EncryptionError(`Invalid IV length: expected ${IV_LENGTH} bytes.`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new EncryptionError(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH} bytes.`);
  }

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err: any) {
    throw new EncryptionError(
      'Decryption failed. The ciphertext may have been tampered with or the encryption key is incorrect.'
    );
  }
}

/**
 * Recursively redacts sensitive fields (passwords, tokens, keys) from an object or array.
 */
export function redactSensitiveData<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  const sensitiveKeys = new Set([
    'password',
    'encryptedpassword',
    'passwordencrypted',
    'token',
    'secret',
    'authorization',
    'api_key',
    'apikey',
    'jwt_secret',
    'merchant_secret',
  ]);

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.has(lowerKey)) {
      result[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      result[key] = redactSensitiveData(val);
    } else {
      result[key] = val;
    }
  }

  return result as T;
}
