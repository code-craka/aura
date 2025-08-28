"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformManager = void 0;
const events_1 = require("events");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
class PlatformManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.updateCheckInterval = null;
        this.platformInfo = this.detectPlatform();
        this.capabilities = this.detectCapabilities();
        this.currentTheme = this.getDefaultTheme();
        this.optimizations = this.getDefaultOptimizations();
        this.distributionConfig = this.getDefaultDistributionConfig();
        this.initializePlatformIntegration();
        this.startUpdateChecks();
    }
    /**
     * Get current platform information
     */
    getPlatformInfo() {
        return { ...this.platformInfo };
    }
    /**
     * Get platform capabilities
     */
    getCapabilities() {
        return { ...this.capabilities };
    }
    /**
     * Get current platform theme
     */
    getCurrentTheme() {
        return { ...this.currentTheme };
    }
    /**
     * Set platform theme
     */
    async setTheme(theme) {
        try {
            this.currentTheme = { ...this.currentTheme, ...theme };
            await this.applyTheme(this.currentTheme);
            this.emit('themeChanged', this.currentTheme);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Theme application failed: ${error}`);
        }
    }
    /**
     * Get platform-specific optimizations
     */
    getOptimizations() {
        return { ...this.optimizations };
    }
    /**
     * Apply platform optimizations
     */
    async applyOptimizations(optimizations) {
        try {
            this.optimizations = { ...this.optimizations, ...optimizations };
            await this.configurePlatformOptimizations(this.optimizations);
            this.emit('optimizationsApplied', this.optimizations);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Optimization application failed: ${error}`);
        }
    }
    /**
     * Create distribution package
     */
    async createDistribution(sourcePath, outputPath, config) {
        try {
            const distConfig = { ...this.distributionConfig, ...config };
            const packages = [];
            for (const platform of distConfig.platforms) {
                for (const arch of distConfig.architectures) {
                    const packagePath = await this.buildPackage(sourcePath, outputPath, platform, arch, distConfig);
                    packages.push(packagePath);
                }
            }
            this.emit('distributionCreated', packages);
            return packages;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Distribution creation failed: ${error}`);
        }
    }
    /**
     * Check for updates
     */
    async checkForUpdates() {
        try {
            // In a real implementation, this would check a remote update server
            // For now, return mock update info
            const updateInfo = {
                version: '1.1.0',
                releaseNotes: 'Bug fixes and performance improvements',
                downloadUrl: 'https://example.com/download/update.zip',
                fileSize: 50 * 1024 * 1024, // 50MB
                checksum: 'mock_checksum',
                releaseDate: new Date()
            };
            this.emit('updateAvailable', updateInfo);
            return updateInfo;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Update check failed: ${error}`);
        }
    }
    /**
     * Download and install update
     */
    async installUpdate(updateInfo) {
        try {
            const progressCallback = (progress) => {
                this.emit('updateProgress', progress);
            };
            await this.downloadUpdate(updateInfo, progressCallback);
            await this.verifyUpdate(updateInfo);
            await this.installUpdatePackage(updateInfo);
            await this.cleanupAfterUpdate();
            this.emit('updateInstalled', updateInfo);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Update installation failed: ${error}`);
        }
    }
    /**
     * Rollback to previous version
     */
    async rollbackUpdate() {
        try {
            await this.createBackup();
            await this.restoreFromBackup();
            this.emit('updateRolledBack');
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Rollback failed: ${error}`);
        }
    }
    /**
     * Get system information
     */
    getSystemInfo() {
        return {
            platform: this.platformInfo,
            capabilities: this.capabilities,
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem()
            },
            cpu: {
                model: os.cpus()[0]?.model || 'Unknown',
                cores: os.cpus().length,
                speed: os.cpus()[0]?.speed || 0
            },
            network: {
                hostname: os.hostname(),
                interfaces: os.networkInterfaces()
            }
        };
    }
    // Private methods
    detectPlatform() {
        const platform = os.platform();
        const release = os.release();
        const arch = os.arch();
        let type = 'unknown';
        let version = release;
        let codename;
        switch (platform) {
            case 'win32':
                type = 'windows';
                // Parse Windows version
                break;
            case 'darwin':
                type = 'macos';
                // Parse macOS version
                break;
            case 'linux':
                type = 'linux';
                // Parse Linux distribution
                break;
        }
        return {
            type,
            version,
            architecture: arch,
            release,
            codename
        };
    }
    detectCapabilities() {
        const platform = os.platform();
        return {
            hasHardwareAcceleration: true, // Most modern systems support this
            supportsNativeNotifications: platform === 'darwin' || platform === 'win32',
            hasSystemTray: platform === 'darwin' || platform === 'win32' || platform === 'linux',
            supportsDarkMode: platform === 'darwin' || platform === 'win32',
            hasTouchSupport: this.detectTouchSupport(),
            supportsMultipleDisplays: true,
            hasAccelerometer: platform === 'darwin', // macOS has accelerometer support
            supportsHaptics: platform === 'darwin'
        };
    }
    detectTouchSupport() {
        // This would detect actual touch support
        // For now, assume touch support on certain platforms
        return os.platform() === 'darwin' || os.platform() === 'linux';
    }
    getDefaultTheme() {
        const isDark = this.shouldUseDarkTheme();
        return {
            name: isDark ? 'dark' : 'light',
            colors: {
                primary: isDark ? '#BB86FC' : '#6200EE',
                secondary: isDark ? '#03DAC6' : '#03DAC6',
                accent: isDark ? '#CF6679' : '#FF4081',
                background: isDark ? '#121212' : '#FAFAFA',
                surface: isDark ? '#1E1E1E' : '#FFFFFF',
                text: isDark ? '#FFFFFF' : '#000000',
                textSecondary: isDark ? '#B3B3B3' : '#666666'
            },
            fonts: {
                family: this.getPlatformFontFamily(),
                size: {
                    small: 12,
                    medium: 14,
                    large: 16
                }
            },
            spacing: {
                small: 4,
                medium: 8,
                large: 16
            },
            borderRadius: 4,
            shadows: {
                small: '0 1px 3px rgba(0,0,0,0.12)',
                medium: '0 4px 6px rgba(0,0,0,0.16)',
                large: '0 10px 25px rgba(0,0,0,0.19)'
            }
        };
    }
    shouldUseDarkTheme() {
        // Check system preference for dark mode
        // This is a simplified implementation
        return false; // Default to light theme
    }
    getPlatformFontFamily() {
        switch (this.platformInfo.type) {
            case 'macos':
                return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            case 'windows':
                return '"Segoe UI", Tahoma, sans-serif';
            case 'linux':
                return '"Ubuntu", "DejaVu Sans", sans-serif';
            default:
                return 'system-ui, sans-serif';
        }
    }
    getDefaultOptimizations() {
        const baseOptimizations = {
            memoryPoolSize: 100 * 1024 * 1024, // 100MB
            threadPoolSize: 4,
            gpuMemoryLimit: 256 * 1024 * 1024, // 256MB
            networkBufferSize: 64 * 1024, // 64KB
            fileCacheSize: 50 * 1024 * 1024, // 50MB
            enableHardwareAcceleration: this.capabilities.hasHardwareAcceleration,
            enableCompositing: true,
            textureCompression: true
        };
        // Platform-specific adjustments
        switch (this.platformInfo.type) {
            case 'macos':
                baseOptimizations.memoryPoolSize = 150 * 1024 * 1024; // More memory on macOS
                break;
            case 'linux':
                baseOptimizations.threadPoolSize = 8; // More threads on Linux
                break;
            case 'windows':
                baseOptimizations.gpuMemoryLimit = 512 * 1024 * 1024; // More GPU memory on Windows
                break;
        }
        return baseOptimizations;
    }
    getDefaultDistributionConfig() {
        return {
            platforms: ['windows', 'macos', 'linux'],
            architectures: ['x64', 'arm64'],
            formats: ['exe', 'dmg', 'deb'],
            signing: {
                enabled: false
            },
            compression: {
                enabled: true,
                level: 6,
                algorithm: 'gzip'
            }
        };
    }
    async initializePlatformIntegration() {
        // Initialize platform-specific integrations
        switch (this.platformInfo.type) {
            case 'macos':
                await this.initializeMacOSIntegration();
                break;
            case 'windows':
                await this.initializeWindowsIntegration();
                break;
            case 'linux':
                await this.initializeLinuxIntegration();
                break;
        }
    }
    startUpdateChecks() {
        // Check for updates every 4 hours
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates().catch(error => {
                console.error('Update check error:', error);
            });
        }, 4 * 60 * 60 * 1000);
    }
    async applyTheme(theme) {
        // Apply theme to native UI components
        // This would integrate with platform-specific APIs
        this.emit('themeApplied', theme);
    }
    async configurePlatformOptimizations(optimizations) {
        // Configure platform-specific optimizations
        this.emit('optimizationsConfigured', optimizations);
    }
    async buildPackage(_sourcePath, outputPath, platform, arch, _config) {
        // Build platform-specific package
        const packageName = `aura-browser-${platform}-${arch}`;
        const packagePath = path.join(outputPath, packageName);
        // In a real implementation, this would use platform-specific build tools
        // like electron-builder, pkg, or native tools
        this.emit('packageBuilt', { platform, arch, path: packagePath });
        return packagePath;
    }
    async downloadUpdate(updateInfo, progressCallback) {
        // Download update package with progress tracking
        this.emit('updateDownloadStarted', updateInfo);
        // Mock download progress
        for (let progress = 0; progress <= 100; progress += 10) {
            progressCallback({
                stage: 'downloading',
                progress,
                speed: 1024 * 1024, // 1MB/s
                eta: (100 - progress) * 100
            });
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        this.emit('updateDownloaded', updateInfo);
    }
    async verifyUpdate(updateInfo) {
        // Verify update package integrity
        this.emit('updateVerified', updateInfo);
    }
    async installUpdatePackage(updateInfo) {
        // Install the update package
        this.emit('updatePackageInstalled', updateInfo);
    }
    async cleanupAfterUpdate() {
        // Clean up temporary files
        this.emit('updateCleanupCompleted');
    }
    async createBackup() {
        // Create backup of current installation
        this.emit('backupCreated');
    }
    async restoreFromBackup() {
        // Restore from backup
        this.emit('backupRestored');
    }
    async initializeMacOSIntegration() {
        // macOS-specific initialization
        this.emit('macOSIntegrationInitialized');
    }
    async initializeWindowsIntegration() {
        // Windows-specific initialization
        this.emit('windowsIntegrationInitialized');
    }
    async initializeLinuxIntegration() {
        // Linux-specific initialization
        this.emit('linuxIntegrationInitialized');
    }
    destroy() {
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
        }
        this.emit('destroyed');
    }
}
exports.PlatformManager = PlatformManager;
//# sourceMappingURL=platform-manager.js.map