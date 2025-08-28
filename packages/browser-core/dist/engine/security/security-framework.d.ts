import { EventEmitter } from 'events';
/**
 * AuraSecurityFramework - Comprehensive Security Framework
 *
 * Provides sandboxing, threat detection, privacy protection, and secure storage
 */
export interface SandboxConfig {
    memoryLimit: number;
    cpuLimit: number;
    networkAccess: boolean;
    fileSystemAccess: boolean;
    permissions: string[];
}
export interface ThreatDetectionResult {
    threatType: 'malware' | 'phishing' | 'suspicious' | 'safe';
    confidence: number;
    details: string;
    timestamp: Date;
}
export interface PrivacyFilterResult {
    filtered: boolean;
    sensitiveData: string[];
    safeContent: string;
}
export interface SecureStorageData {
    key: string;
    data: Uint8Array;
    metadata: {
        created: Date;
        expires?: Date;
        checksum: string;
    };
}
export declare class AuraSecurityFramework extends EventEmitter {
    private sandboxes;
    private threatPatterns;
    private privacyFilters;
    private secureStorage;
    constructor();
    /**
     * Create a new sandbox environment
     */
    createSandbox(config: SandboxConfig): Promise<string>;
    /**
     * Destroy a sandbox environment
     */
    destroySandbox(sandboxId: string): Promise<void>;
    /**
     * Validate permissions for a sandbox
     */
    validatePermission(sandboxId: string, permission: string): boolean;
    /**
     * Scan content for threats
     */
    scanForThreats(content: string): Promise<ThreatDetectionResult>;
    /**
     * Filter content for privacy protection
     */
    filterPrivacyData(content: string): Promise<PrivacyFilterResult>;
    /**
     * Encrypt data using AES-GCM
     */
    encryptData(data: Uint8Array, key: Uint8Array): Promise<Uint8Array>;
    /**
     * Decrypt data using AES-GCM
     */
    decryptData(encryptedData: Uint8Array, key: Uint8Array): Promise<Uint8Array>;
    /**
     * Store data securely
     */
    storeSecureData(key: string, data: Uint8Array): Promise<void>;
    /**
     * Retrieve data from secure storage
     */
    retrieveSecureData(key: string): Promise<Uint8Array>;
    /**
     * Monitor network requests for security
     */
    monitorNetworkRequest(url: string, method: string): Promise<boolean>;
    private initializeThreatPatterns;
    private initializePrivacyFilters;
    private calculateThreatConfidence;
    private classifyThreat;
    private calculateChecksum;
}
//# sourceMappingURL=security-framework.d.ts.map