/**
 * Authentication and API Key Management
 * 
 * Centralized authentication management for all AI providers.
 * Handles secure storage, rotation, and validation of API keys.
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface AuthCredentials {
  apiKey: string;
  organization?: string;
  projectId?: string;
  region?: string;
  endpoint?: string;
}

export interface AuthConfig {
  provider: string;
  credentials: AuthCredentials;
  expiresAt?: Date;
  rotationInterval?: number; // in milliseconds
  encrypted?: boolean;
}

export interface AuthValidationResult {
  valid: boolean;
  error?: string;
  expiresAt?: Date;
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    remaining: number;
  };
}

export class AuthManager extends EventEmitter {
  private authStore: Map<string, AuthConfig> = new Map();
  private encryptionKey: string;
  private rotationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(encryptionKey?: string) {
    super();
    this.encryptionKey = encryptionKey || this.generateEncryptionKey();
  }

  /**
   * Store authentication credentials for a provider
   */
  async storeCredentials(
    provider: string, 
    credentials: AuthCredentials,
    options?: {
      encrypt?: boolean;
      rotationInterval?: number;
      expiresAt?: Date;
    }
  ): Promise<void> {
    const config: AuthConfig = {
      provider,
      credentials: options?.encrypt ? this.encryptCredentials(credentials) : credentials,
      encrypted: options?.encrypt || false,
      expiresAt: options?.expiresAt,
      rotationInterval: options?.rotationInterval
    };

    this.authStore.set(provider, config);

    // Set up automatic rotation if specified
    if (options?.rotationInterval) {
      this.setupRotation(provider, options.rotationInterval);
    }

    this.emit('credentials-stored', { provider, encrypted: config.encrypted });
  }

  /**
   * Retrieve authentication credentials for a provider
   */
  async getCredentials(provider: string): Promise<AuthCredentials | null> {
    const config = this.authStore.get(provider);
    if (!config) {
      return null;
    }

    // Check if credentials have expired
    if (config.expiresAt && config.expiresAt < new Date()) {
      this.emit('credentials-expired', { provider });
      return null;
    }

    return config.encrypted 
      ? this.decryptCredentials(config.credentials)
      : config.credentials;
  }

  /**
   * Validate credentials with the provider
   */
  async validateCredentials(
    provider: string,
    validator: (credentials: AuthCredentials) => Promise<AuthValidationResult>
  ): Promise<AuthValidationResult> {
    const credentials = await this.getCredentials(provider);
    if (!credentials) {
      return {
        valid: false,
        error: 'No credentials found for provider'
      };
    }

    try {
      const result = await validator(credentials);
      
      if (result.valid) {
        this.emit('credentials-validated', { provider });
      } else {
        this.emit('credentials-invalid', { provider, error: result.error });
      }

      return result;
    } catch (error) {
      const errorMessage = `Validation failed: ${(error as Error).message}`;
      this.emit('credentials-invalid', { provider, error: errorMessage });
      
      return {
        valid: false,
        error: errorMessage
      };
    }
  }

  /**
   * Update credentials for a provider
   */
  async updateCredentials(
    provider: string,
    credentials: Partial<AuthCredentials>
  ): Promise<void> {
    const existing = await this.getCredentials(provider);
    if (!existing) {
      throw new Error(`No existing credentials found for provider: ${provider}`);
    }

    const updated = { ...existing, ...credentials };
    const config = this.authStore.get(provider)!;
    
    await this.storeCredentials(provider, updated, {
      encrypt: config.encrypted,
      rotationInterval: config.rotationInterval,
      expiresAt: config.expiresAt
    });

    this.emit('credentials-updated', { provider });
  }

  /**
   * Remove credentials for a provider
   */
  async removeCredentials(provider: string): Promise<void> {
    this.authStore.delete(provider);
    
    // Clear rotation timer if exists
    const timer = this.rotationTimers.get(provider);
    if (timer) {
      clearInterval(timer);
      this.rotationTimers.delete(provider);
    }

    this.emit('credentials-removed', { provider });
  }

  /**
   * List all configured providers
   */
  getConfiguredProviders(): string[] {
    return Array.from(this.authStore.keys());
  }

  /**
   * Check if credentials exist for a provider
   */
  hasCredentials(provider: string): boolean {
    return this.authStore.has(provider);
  }

  /**
   * Get credential status for a provider
   */
  getCredentialStatus(provider: string): {
    exists: boolean;
    encrypted: boolean;
    expiresAt?: Date;
    hasRotation: boolean;
  } | null {
    const config = this.authStore.get(provider);
    if (!config) {
      return null;
    }

    return {
      exists: true,
      encrypted: config.encrypted || false,
      expiresAt: config.expiresAt,
      hasRotation: !!config.rotationInterval
    };
  }

  /**
   * Setup automatic credential rotation
   */
  private setupRotation(provider: string, interval: number): void {
    // Clear existing timer if any
    const existingTimer = this.rotationTimers.get(provider);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const timer = setInterval(() => {
      this.emit('rotation-required', { provider });
    }, interval);

    this.rotationTimers.set(provider, timer);
  }

  /**
   * Encrypt credentials using AES-256-GCM
   */
  private encryptCredentials(credentials: AuthCredentials): AuthCredentials {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    
    const encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex') + 
                     cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      apiKey: `encrypted:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`,
      organization: credentials.organization,
      projectId: credentials.projectId,
      region: credentials.region,
      endpoint: credentials.endpoint
    };
  }

  /**
   * Decrypt credentials
   */
  private decryptCredentials(encryptedCredentials: AuthCredentials): AuthCredentials {
    if (!encryptedCredentials.apiKey.startsWith('encrypted:')) {
      return encryptedCredentials; // Not encrypted
    }

    const algorithm = 'aes-256-gcm';
    const parts = encryptedCredentials.apiKey.split(':');
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
    decipher.setAuthTag(authTag);
    
    const decrypted = decipher.update(encrypted, 'hex', 'utf8') + 
                     decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Generate a secure encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clear all rotation timers
    for (const timer of this.rotationTimers.values()) {
      clearInterval(timer);
    }
    this.rotationTimers.clear();
    
    // Clear auth store
    this.authStore.clear();
    
    // Remove all listeners
    this.removeAllListeners();
  }
}