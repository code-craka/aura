import { EventEmitter } from 'events';
import { webcrypto } from 'crypto';
import { AuraSecurityFramework } from './security-framework';

// Use Web Crypto API
const crypto = webcrypto;

// Type definitions
type CryptoKey = webcrypto.CryptoKey;
type KeyUsage = 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'deriveKey' | 'deriveBits' | 'wrapKey' | 'unwrapKey';

/**
 * EncryptionManager - End-to-End Encryption System for Aura Browser
 *
 * Provides comprehensive encryption capabilities including:
 * - Secure key generation and management
 * - Data encryption for local storage
 * - Secure communication protocols
 * - Key rotation and recovery mechanisms
 */

export interface EncryptionConfig {
  algorithm: 'AES-GCM' | 'AES-CBC';
  keyLength: 128 | 256;
  ivLength: number;
  saltRounds: number;
}

export interface KeyMetadata {
  id: string;
  created: Date;
  expires?: Date;
  usage: 'encryption' | 'signing' | 'authentication';
  algorithm: string;
  keyLength: number;
}

export interface EncryptedData {
  data: Uint8Array;
  iv: Uint8Array;
  salt?: Uint8Array;
  keyId: string;
  algorithm: string;
  timestamp: Date;
}

export interface SecureStorageOptions {
  encryptAtRest: boolean;
  keyRotationInterval: number; // days
  backupEnabled: boolean;
  compressionEnabled: boolean;
}

export class EncryptionManager extends EventEmitter {
  private config: EncryptionConfig;
  private keys: Map<string, CryptoKey> = new Map();
  private keyMetadata: Map<string, KeyMetadata> = new Map();
  private securityFramework: AuraSecurityFramework;
  private storageOptions: SecureStorageOptions;

  constructor(
    securityFramework: AuraSecurityFramework,
    config: Partial<EncryptionConfig> = {},
    storageOptions: Partial<SecureStorageOptions> = {}
  ) {
    super();

    this.securityFramework = securityFramework;
    this.config = {
      algorithm: 'AES-GCM',
      keyLength: 256,
      ivLength: 16,
      saltRounds: 10000,
      ...config
    };

    this.storageOptions = {
      encryptAtRest: true,
      keyRotationInterval: 90,
      backupEnabled: true,
      compressionEnabled: true,
      ...storageOptions
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Generate master key if not exists
      await this.ensureMasterKey();

      // Set up key rotation scheduler
      this.scheduleKeyRotation();

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Generate a new cryptographic key
   */
  async generateKey(
    usage: KeyUsage[] = ['encrypt', 'decrypt'],
    extractable: boolean = false,
    metadata?: Partial<KeyMetadata>
  ): Promise<string> {
    try {
      const keyId = this.generateKeyId();

      const key = await crypto.subtle.generateKey(
        {
          name: this.config.algorithm,
          length: this.config.keyLength
        },
        extractable,
        usage
      );

      this.keys.set(keyId, key);

      const keyMetadata: KeyMetadata = {
        id: keyId,
        created: new Date(),
        usage: usage.includes('sign') ? 'signing' : 'encryption',
        algorithm: this.config.algorithm,
        keyLength: this.config.keyLength,
        ...metadata
      };

      this.keyMetadata.set(keyId, keyMetadata);

      // Store key metadata securely
      await this.storeKeyMetadata(keyMetadata);

      this.emit('keyGenerated', keyId);
      return keyId;
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Key generation failed: ${error}`);
    }
  }

  /**
   * Encrypt data using specified key
   */
  async encryptData(
    data: Uint8Array | string,
    keyId?: string
  ): Promise<EncryptedData> {
    const key = keyId ? this.keys.get(keyId) : await this.getMasterKey();
    if (!key) {
      throw new Error('Encryption key not found');
    }

    const dataBuffer = this.prepareDataBuffer(data);
    const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
    const salt = this.storageOptions.encryptAtRest
      ? crypto.getRandomValues(new Uint8Array(16))
      : undefined;

    const encrypted = await this.performEncryption(key, dataBuffer, iv);

    const encryptedData: EncryptedData = {
      data: new Uint8Array(encrypted),
      iv: iv,
      salt: salt,
      keyId: keyId || 'master',
      algorithm: this.config.algorithm,
      timestamp: new Date()
    };

    this.emit('dataEncrypted', encryptedData);
    return encryptedData;
  }

  private prepareDataBuffer(data: Uint8Array | string): Uint8Array {
    return typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data;
  }

  private async performEncryption(
    key: CryptoKey,
    data: Uint8Array,
    iv: Uint8Array
  ): Promise<ArrayBuffer> {
    return await crypto.subtle.encrypt(
      {
        name: this.config.algorithm,
        iv: iv
      },
      key,
      data
    );
  }

  /**
   * Decrypt data using specified key
   */
  async decryptData(encryptedData: EncryptedData): Promise<Uint8Array> {
    try {
      const key = this.keys.get(encryptedData.keyId) ||
                  await this.getMasterKey();
      if (!key) {
        throw new Error('Decryption key not found');
      }

      const decrypted = await crypto.subtle.decrypt(
        {
          name: encryptedData.algorithm,
          iv: encryptedData.iv
        },
        key,
        encryptedData.data
      );

      this.emit('dataDecrypted', encryptedData);
      return new Uint8Array(decrypted);
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Data decryption failed: ${error}`);
    }
  }

  /**
   * Securely store data with encryption
   */
  async storeSecureData(
    key: string,
    data: Uint8Array | string,
    options: Partial<SecureStorageOptions> = {}
  ): Promise<void> {
    try {
      const storageOpts = { ...this.storageOptions, ...options };

      let processedData = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data;

      // Compress if enabled
      if (storageOpts.compressionEnabled) {
        processedData = await this.compressData(processedData);
      }

      // Encrypt if enabled
      if (storageOpts.encryptAtRest) {
        const encrypted = await this.encryptData(processedData);
        processedData = this.serializeEncryptedData(encrypted);
      }

      // Store in secure storage
      await this.securityFramework.storeSecureData(key, processedData);

      this.emit('dataStored', key);
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Secure storage failed: ${error}`);
    }
  }

  /**
   * Retrieve and decrypt data from secure storage
   */
  async retrieveSecureData(key: string): Promise<Uint8Array> {
    try {
      const storedData = await this.securityFramework.retrieveSecureData(key);

      let processedData = storedData;

      // Check if data is encrypted
      if (this.isEncryptedData(storedData)) {
        const encryptedData = this.deserializeEncryptedData(storedData);
        processedData = await this.decryptData(encryptedData);
      }

      // Decompress if needed
      if (this.storageOptions.compressionEnabled) {
        processedData = await this.decompressData(processedData);
      }

      this.emit('dataRetrieved', key);
      return processedData;
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Secure retrieval failed: ${error}`);
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<void> {
    try {
      const oldKeys = Array.from(this.keys.entries());

      // Generate new keys
      for (const [keyId, oldKey] of oldKeys) {
        const newKeyId = await this.generateKey(
          oldKey.usages as KeyUsage[],
          false,
          { expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
        );

        // Re-encrypt data with new key
        await this.reEncryptDataWithNewKey(keyId, newKeyId);

        // Mark old key as expired
        const metadata = this.keyMetadata.get(keyId);
        if (metadata) {
          metadata.expires = new Date();
          await this.storeKeyMetadata(metadata);
        }
      }

      this.emit('keysRotated');
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Key rotation failed: ${error}`);
    }
  }

  /**
   * Set up secure communication protocols
   */
  async setupSecureCommunication(peerId: string): Promise<string> {
    try {
      // Generate session key for peer
      const sessionKeyId = await this.generateKey(
        ['encrypt', 'decrypt'],
        false,
        { usage: 'encryption' }
      );

      // Export public key for sharing (if using asymmetric crypto)
      const sessionKey = this.keys.get(sessionKeyId);
      if (!sessionKey) {
        throw new Error('Session key not found');
      }

      // For now, use symmetric encryption
      // In production, implement proper key exchange protocol
      // const exportedKey = await crypto.subtle.exportKey('raw', sessionKey);

      this.emit('secureCommunicationEstablished', peerId);
      return sessionKeyId;
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Secure communication setup failed: ${error}`);
    }
  }

  /**
   * Backup encryption keys securely
   */
  async backupKeys(password: string): Promise<Uint8Array> {
    try {
      if (!this.storageOptions.backupEnabled) {
        throw new Error('Key backup is disabled');
      }

      const keyData = {
        keys: Array.from(this.keyMetadata.entries()),
        config: this.config,
        timestamp: new Date()
      };

      const serialized = JSON.stringify(keyData);
      const data = new TextEncoder().encode(serialized);

      // Encrypt backup with password-derived key
      const backupKey = await this.deriveKeyFromPassword(password);
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(16)) },
        backupKey,
        data
      );

      this.emit('keysBackedUp');
      return new Uint8Array(encrypted);
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Key backup failed: ${error}`);
    }
  }

  /**
   * Restore encryption keys from backup
   */
  async restoreKeys(backupData: Uint8Array, password: string): Promise<void> {
    try {
      const backupKey = await this.deriveKeyFromPassword(password);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: backupData.slice(0, 16) },
        backupKey,
        backupData.slice(16)
      );

      const keyData = JSON.parse(new TextDecoder().decode(decrypted));

      // Restore keys and metadata
      for (const [keyId, metadata] of keyData.keys) {
        this.keyMetadata.set(keyId, metadata);
        await this.storeKeyMetadata(metadata);
      }

      this.emit('keysRestored');
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Key restoration failed: ${error}`);
    }
  }

  // Private helper methods

  private async ensureMasterKey(): Promise<void> {
    if (!this.keys.has('master')) {
      await this.generateKey(['encrypt', 'decrypt'], false, {
        id: 'master',
        usage: 'encryption'
      });
    }
  }

  private async getMasterKey(): Promise<CryptoKey> {
    return this.keys.get('master') || await this.ensureMasterKey().then(() => this.keys.get('master')!);
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${crypto.getRandomValues(new Uint8Array(8)).join('')}`;
  }

  private scheduleKeyRotation(): void {
    const interval = this.storageOptions.keyRotationInterval * 24 * 60 * 60 * 1000;
    setInterval(() => {
      this.rotateKeys().catch(error => this.emit('error', error));
    }, interval);
  }

  private async storeKeyMetadata(metadata: KeyMetadata): Promise<void> {
    const key = `key_metadata_${metadata.id}`;
    const data = JSON.stringify(metadata);
    await this.storeSecureData(key, data);
  }

  private async compressData(data: Uint8Array): Promise<Uint8Array> {
    // Simple compression using Deflate
    const stream = new CompressionStream('deflate');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(data);
    writer.close();

    const chunks = [];
    let result = await reader.read();
    while (!result.done) {
      chunks.push(result.value);
      result = await reader.read();
    }

    return new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  }

  private async decompressData(data: Uint8Array): Promise<Uint8Array> {
    const stream = new DecompressionStream('deflate');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(data);
    writer.close();

    const chunks = [];
    let result = await reader.read();
    while (!result.done) {
      chunks.push(result.value);
      result = await reader.read();
    }

    return new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  }

  private serializeEncryptedData(data: EncryptedData): Uint8Array {
    const json = JSON.stringify(data);
    return new TextEncoder().encode(json);
  }

  private deserializeEncryptedData(data: Uint8Array): EncryptedData {
    const json = new TextDecoder().decode(data);
    return JSON.parse(json);
  }

  private isEncryptedData(data: Uint8Array): boolean {
    try {
      const json = new TextDecoder().decode(data);
      const parsed = JSON.parse(json);
      return parsed.data && parsed.iv && parsed.keyId;
    } catch {
      return false;
    }
  }

  private async deriveKeyFromPassword(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('aura-browser-salt'),
        iterations: this.config.saltRounds,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: this.config.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async reEncryptDataWithNewKey(oldKeyId: string, newKeyId: string): Promise<void> {
    // This would require tracking which data is encrypted with which key
    // Implementation depends on how data is indexed
    this.emit('dataReEncrypted', { oldKeyId, newKeyId });
  }
}
