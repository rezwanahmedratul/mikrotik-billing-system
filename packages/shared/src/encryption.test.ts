import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  encrypt,
  decrypt,
  normalizeEncryptionKey,
  redactSensitiveData,
  EncryptionError,
} from './encryption';

describe('AES-256-GCM Credential Encryption & Redaction', () => {
  const validHexKey = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
  const alternativeHexKey = 'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100';

  const originalEnv = process.env.APP_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.APP_ENCRYPTION_KEY = validHexKey;
  });

  afterEach(() => {
    process.env.APP_ENCRYPTION_KEY = originalEnv;
  });

  it('normalizes a 64-char hex key to 32 bytes Buffer', () => {
    const key = normalizeEncryptionKey(validHexKey);
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it('throws EncryptionError when key is missing or invalid', () => {
    delete process.env.APP_ENCRYPTION_KEY;
    expect(() => normalizeEncryptionKey()).toThrow(EncryptionError);
    expect(() => normalizeEncryptionKey('short_key')).toThrow(EncryptionError);
  });

  it('encrypts and decrypts router passwords faithfully', () => {
    const originalPassword = 'SuperSecretMikrotikAdminPass2026!#$';
    const ciphertext = encrypt(originalPassword);

    expect(ciphertext).not.toBe(originalPassword);
    // Format must be iv:authTag:ciphertext (3 parts separated by :)
    const parts = ciphertext.split(':');
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(24); // 12 bytes = 24 hex chars
    expect(parts[1].length).toBe(32); // 16 bytes = 32 hex chars

    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(originalPassword);
  });

  it('produces unique ciphertexts for identical plaintext (different IVs)', () => {
    const plain = 'SamePasswordEveryTime';
    const c1 = encrypt(plain);
    const c2 = encrypt(plain);

    expect(c1).not.toBe(c2);
    expect(decrypt(c1)).toBe(plain);
    expect(decrypt(c2)).toBe(plain);
  });

  it('fails decryption when decrypted with a different key', () => {
    const plain = 'SecretConfidentialData';
    const ciphertext = encrypt(plain, validHexKey);

    expect(() => decrypt(ciphertext, alternativeHexKey)).toThrow(EncryptionError);
  });

  it('fails decryption and detects ciphertext tampering (GCM auth tag verification)', () => {
    const plain = 'IntegrityCheckedPayload';
    const ciphertext = encrypt(plain);
    const parts = ciphertext.split(':');

    // Tamper with the last character of the ciphertext
    const tamperedPayload = parts[2].slice(0, -1) + (parts[2].endsWith('a') ? 'b' : 'a');
    const tamperedCiphertext = `${parts[0]}:${parts[1]}:${tamperedPayload}`;

    expect(() => decrypt(tamperedCiphertext)).toThrow(EncryptionError);
  });

  it('redacts sensitive fields in nested payloads', () => {
    const input = {
      id: 'rtr-1',
      name: 'Gulshan Core',
      username: 'admin',
      password: 'PlainSecretPassword',
      encryptedPassword: 'iv:tag:data',
      config: {
        token: 'secret-token-123',
        port: 8728,
      },
      list: [{ secret: 'private-key', safe: 'public-data' }],
    };

    const redacted = redactSensitiveData(input);
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.encryptedPassword).toBe('[REDACTED]');
    expect(redacted.config.token).toBe('[REDACTED]');
    expect(redacted.config.port).toBe(8728);
    expect(redacted.list[0].secret).toBe('[REDACTED]');
    expect(redacted.list[0].safe).toBe('public-data');
    expect(redacted.name).toBe('Gulshan Core');
  });
});
