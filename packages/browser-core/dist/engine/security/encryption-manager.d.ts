import { EventEmitter } from 'events';
import { AuraSecurityFramework } from './security-framework';
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
    keyRotationInterval: number;
    backupEnabled: boolean;
    compressionEnabled: boolean;
}
export declare class EncryptionManager extends EventEmitter {
    private config;
    private keys;
    private keyMetadata;
    private securityFramework;
    private storageOptions;
    constructor(securityFramework: AuraSecurityFramework, config?: Partial<EncryptionConfig>, storageOptions?: Partial<SecureStorageOptions>);
    private initialize;
    /**
     * Generate a new cryptographic key
     */
    generateKey(usage?: KeyUsage[], extractable?: boolean, metadata?: Partial<KeyMetadata>): Promise<string>;
    /**
     * Encrypt data using specified key
     */
    encryptData(data: Uint8Array | string, keyId?: string): Promise<EncryptedData>;
    private prepareDataBuffer;
    private performEncryption;
    /**
     * Decrypt data using specified key
     */
    decryptData(encryptedData: EncryptedData): Promise<Uint8Array>;
    /**
     * Securely store data with encryption
     */
    storeSecureData(key: string, data: Uint8Array | string, options?: Partial<SecureStorageOptions>): Promise<void>;
    /**
     * Retrieve and decrypt data from secure storage
     */
    retrieveSecureData(key: string): Promise<Uint8Array>;
    /**
     * Rotate encryption keys
     */
    rotateKeys(): Promise<void>;
    /**
     * Set up secure communication protocols
     */
    setupSecureCommunication(peerId: string): Promise<string>;
    /**
     * Backup encryption keys securely
     */
    backupKeys(password: string): Promise<Uint8Array>;
    /**
     * Restore encryption keys from backup
     */
    restoreKeys(backupData: Uint8Array, password: string): Promise<void>;
    private ensureMasterKey;
    private getMasterKey;
    private generateKeyId;
    private scheduleKeyRotation;
    private storeKeyMetadata;
    private compressData;
    private decompressData;
    private serializeEncryptedData;
    private deserializeEncryptedData;
    private isEncryptedData;
    private deriveKeyFromPassword;
    private reEncryptDataWithNewKey;
}
export {};
//# sourceMappingURL=encryption-manager.d.ts.map