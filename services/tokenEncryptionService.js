import crypto from 'crypto';

/**
 * Server-side encryption service for Google OAuth Refresh Tokens.
 * Uses AES-256-GCM with authentication tags.
 * Ensures refresh tokens are never stored in plaintext or exposed to frontend JavaScript.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Derive 32-byte key from environment or fallback hash
const getEncryptionKey = () => {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.GOOGLE_CLIENT_SECRET || 'seo-boulder-secure-token-key-2026';
  return crypto.createHash('sha256').update(String(secret)).digest();
};

/**
 * Encrypt plaintext token
 * Returns base64 string formatted as: iv:encryptedData:authTag
 */
export const encryptToken = (plainText) => {
  if (!plainText) return null;
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(String(plainText), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (err) {
    console.error('encryptToken error:', err.message);
    throw new Error('Failed to securely encrypt token');
  }
};

/**
 * Decrypt token ciphertext
 */
export const decryptToken = (cipherText) => {
  if (!cipherText) return null;
  try {
    // If plaintext (for backwards compatibility or test environments)
    if (!cipherText.includes(':')) {
      return cipherText;
    }

    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      return cipherText;
    }

    const [ivHex, encryptedHex, tagHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('decryptToken error:', err.message);
    return null;
  }
};
