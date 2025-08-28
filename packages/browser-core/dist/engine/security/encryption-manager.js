"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionManager = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
// Use Web Crypto API
const crypto = crypto_1.webcrypto;
class EncryptionManager extends events_1.EventEmitter {
    constructor(securityFramework, config = {}, storageOptions = {}) {
        super();
        this.keys = new Map();
        this.keyMetadata = new Map();
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
    async initialize() {
        try {
            // Generate master key if not exists
            await this.ensureMasterKey();
            // Set up key rotation scheduler
            this.scheduleKeyRotation();
            this.emit('initialized');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Generate a new cryptographic key
     */
    async generateKey(usage = ['encrypt', 'decrypt'], extractable = false, metadata) {
        try {
            const keyId = this.generateKeyId();
            const key = await crypto.subtle.generateKey({
                name: this.config.algorithm,
                length: this.config.keyLength
            }, extractable, usage);
            this.keys.set(keyId, key);
            const keyMetadata = {
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
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Key generation failed: ${error}`);
        }
    }
    /**
     * Encrypt data using specified key
     */
    async encryptData(data, keyId) {
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
        const encryptedData = {
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
    prepareDataBuffer(data) {
        return typeof data === 'string'
            ? new TextEncoder().encode(data)
            : data;
    }
    async performEncryption(key, data, iv) {
        return await crypto.subtle.encrypt({
            name: this.config.algorithm,
            iv: iv
        }, key, data);
    }
    /**
     * Decrypt data using specified key
     */
    async decryptData(encryptedData) {
        try {
            const key = this.keys.get(encryptedData.keyId) ||
                await this.getMasterKey();
            if (!key) {
                throw new Error('Decryption key not found');
            }
            const decrypted = await crypto.subtle.decrypt({
                name: encryptedData.algorithm,
                iv: encryptedData.iv
            }, key, encryptedData.data);
            this.emit('dataDecrypted', encryptedData);
            return new Uint8Array(decrypted);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Data decryption failed: ${error}`);
        }
    }
    /**
     * Securely store data with encryption
     */
    async storeSecureData(key, data, options = {}) {
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
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Secure storage failed: ${error}`);
        }
    }
    /**
     * Retrieve and decrypt data from secure storage
     */
    async retrieveSecureData(key) {
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
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Secure retrieval failed: ${error}`);
        }
    }
    /**
     * Rotate encryption keys
     */
    async rotateKeys() {
        try {
            const oldKeys = Array.from(this.keys.entries());
            // Generate new keys
            for (const [keyId, oldKey] of oldKeys) {
                const newKeyId = await this.generateKey(oldKey.usages, false, { expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) });
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
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Key rotation failed: ${error}`);
        }
    }
    /**
     * Set up secure communication protocols
     */
    async setupSecureCommunication(peerId) {
        try {
            // Generate session key for peer
            const sessionKeyId = await this.generateKey(['encrypt', 'decrypt'], false, { usage: 'encryption' });
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
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Secure communication setup failed: ${error}`);
        }
    }
    /**
     * Backup encryption keys securely
     */
    async backupKeys(password) {
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
            const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(16)) }, backupKey, data);
            this.emit('keysBackedUp');
            return new Uint8Array(encrypted);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Key backup failed: ${error}`);
        }
    }
    /**
     * Restore encryption keys from backup
     */
    async restoreKeys(backupData, password) {
        try {
            const backupKey = await this.deriveKeyFromPassword(password);
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: backupData.slice(0, 16) }, backupKey, backupData.slice(16));
            const keyData = JSON.parse(new TextDecoder().decode(decrypted));
            // Restore keys and metadata
            for (const [keyId, metadata] of keyData.keys) {
                this.keyMetadata.set(keyId, metadata);
                await this.storeKeyMetadata(metadata);
            }
            this.emit('keysRestored');
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Key restoration failed: ${error}`);
        }
    }
    // Private helper methods
    async ensureMasterKey() {
        if (!this.keys.has('master')) {
            await this.generateKey(['encrypt', 'decrypt'], false, {
                id: 'master',
                usage: 'encryption'
            });
        }
    }
    async getMasterKey() {
        return this.keys.get('master') || await this.ensureMasterKey().then(() => this.keys.get('master'));
    }
    generateKeyId() {
        return `key_${Date.now()}_${crypto.getRandomValues(new Uint8Array(8)).join('')}`;
    }
    scheduleKeyRotation() {
        const interval = this.storageOptions.keyRotationInterval * 24 * 60 * 60 * 1000;
        setInterval(() => {
            this.rotateKeys().catch(error => this.emit('error', error));
        }, interval);
    }
    async storeKeyMetadata(metadata) {
        const key = `key_metadata_${metadata.id}`;
        const data = JSON.stringify(metadata);
        await this.storeSecureData(key, data);
    }
    async compressData(data) {
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
    async decompressData(data) {
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
    serializeEncryptedData(data) {
        const json = JSON.stringify(data);
        return new TextEncoder().encode(json);
    }
    deserializeEncryptedData(data) {
        const json = new TextDecoder().decode(data);
        return JSON.parse(json);
    }
    isEncryptedData(data) {
        try {
            const json = new TextDecoder().decode(data);
            const parsed = JSON.parse(json);
            return parsed.data && parsed.iv && parsed.keyId;
        }
        catch {
            return false;
        }
    }
    async deriveKeyFromPassword(password) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
        return crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt: encoder.encode('aura-browser-salt'),
            iterations: this.config.saltRounds,
            hash: 'SHA-256'
        }, keyMaterial, { name: 'AES-GCM', length: this.config.keyLength }, false, ['encrypt', 'decrypt']);
    }
    async reEncryptDataWithNewKey(oldKeyId, newKeyId) {
        // This would require tracking which data is encrypted with which key
        // Implementation depends on how data is indexed
        this.emit('dataReEncrypted', { oldKeyId, newKeyId });
    }
}
exports.EncryptionManager = EncryptionManager;
//# sourceMappingURL=encryption-manager.js.map