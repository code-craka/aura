import { EventEmitter } from 'events';
/**
 * PlatformManager - Cross-Platform Support System for Aura Browser
 *
 * Provides comprehensive cross-platform support including:
 * - Platform abstraction layer for OS integration
 * - Native look and feel implementation
 * - Platform-specific optimizations
 * - Distribution and update system
 */
export interface PlatformInfo {
    type: 'windows' | 'macos' | 'linux' | 'unknown';
    version: string;
    architecture: string;
    release: string;
    codename?: string;
}
export interface PlatformCapabilities {
    hasHardwareAcceleration: boolean;
    supportsNativeNotifications: boolean;
    hasSystemTray: boolean;
    supportsDarkMode: boolean;
    hasTouchSupport: boolean;
    supportsMultipleDisplays: boolean;
    hasAccelerometer: boolean;
    supportsHaptics: boolean;
}
export interface PlatformTheme {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
    };
    fonts: {
        family: string;
        size: {
            small: number;
            medium: number;
            large: number;
        };
    };
    spacing: {
        small: number;
        medium: number;
        large: number;
    };
    borderRadius: number;
    shadows: {
        small: string;
        medium: string;
        large: string;
    };
}
export interface PlatformOptimization {
    memoryPoolSize: number;
    threadPoolSize: number;
    gpuMemoryLimit: number;
    networkBufferSize: number;
    fileCacheSize: number;
    enableHardwareAcceleration: boolean;
    enableCompositing: boolean;
    textureCompression: boolean;
}
export interface DistributionConfig {
    platforms: ('windows' | 'macos' | 'linux')[];
    architectures: ('x64' | 'arm64')[];
    formats: ('exe' | 'dmg' | 'deb' | 'rpm' | 'appimage')[];
    signing: {
        enabled: boolean;
        certificatePath?: string;
        certificatePassword?: string;
        identity?: string;
    };
    compression: {
        enabled: boolean;
        level: number;
        algorithm: 'gzip' | 'brotli' | 'lzma';
    };
}
export interface UpdateInfo {
    version: string;
    releaseNotes: string;
    downloadUrl: string;
    fileSize: number;
    checksum: string;
    signature?: string;
    minimumVersion?: string;
    releaseDate: Date;
}
export interface UpdateProgress {
    stage: 'downloading' | 'verifying' | 'installing' | 'cleanup';
    progress: number;
    speed: number;
    eta: number;
    currentFile?: string;
}
export declare class PlatformManager extends EventEmitter {
    private platformInfo;
    private capabilities;
    private currentTheme;
    private optimizations;
    private distributionConfig;
    private updateCheckInterval;
    constructor();
    /**
     * Get current platform information
     */
    getPlatformInfo(): PlatformInfo;
    /**
     * Get platform capabilities
     */
    getCapabilities(): PlatformCapabilities;
    /**
     * Get current platform theme
     */
    getCurrentTheme(): PlatformTheme;
    /**
     * Set platform theme
     */
    setTheme(theme: Partial<PlatformTheme>): Promise<void>;
    /**
     * Get platform-specific optimizations
     */
    getOptimizations(): PlatformOptimization;
    /**
     * Apply platform optimizations
     */
    applyOptimizations(optimizations: Partial<PlatformOptimization>): Promise<void>;
    /**
     * Create distribution package
     */
    createDistribution(sourcePath: string, outputPath: string, config?: Partial<DistributionConfig>): Promise<string[]>;
    /**
     * Check for updates
     */
    checkForUpdates(): Promise<UpdateInfo | null>;
    /**
     * Download and install update
     */
    installUpdate(updateInfo: UpdateInfo): Promise<void>;
    /**
     * Rollback to previous version
     */
    rollbackUpdate(): Promise<void>;
    /**
     * Get system information
     */
    getSystemInfo(): any;
    private detectPlatform;
    private detectCapabilities;
    private detectTouchSupport;
    private getDefaultTheme;
    private shouldUseDarkTheme;
    private getPlatformFontFamily;
    private getDefaultOptimizations;
    private getDefaultDistributionConfig;
    private initializePlatformIntegration;
    private startUpdateChecks;
    private applyTheme;
    private configurePlatformOptimizations;
    private buildPackage;
    private downloadUpdate;
    private verifyUpdate;
    private installUpdatePackage;
    private cleanupAfterUpdate;
    private createBackup;
    private restoreFromBackup;
    private initializeMacOSIntegration;
    private initializeWindowsIntegration;
    private initializeLinuxIntegration;
    destroy(): void;
}
//# sourceMappingURL=platform-manager.d.ts.map