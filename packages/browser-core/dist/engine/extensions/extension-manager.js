"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionManager = void 0;
const events_1 = require("events");
const process_manager_1 = require("../process-manager");
class ExtensionManager extends events_1.EventEmitter {
    constructor(securityFramework, processManager) {
        super();
        this.extensions = new Map();
        this.activeContexts = new Map();
        this.apiHandlers = new Map();
        this.securityFramework = securityFramework;
        this.processManager = processManager;
        this.initializeAPIHandlers();
    }
    /**
     * Install an extension from manifest and source files
     */
    async installExtension(manifestPath, sourcePath) {
        try {
            const manifest = await this.loadManifest(manifestPath);
            const extensionId = this.generateExtensionId(manifest);
            // Validate manifest
            await this.validateManifest(manifest);
            // Create sandbox for extension
            const sandboxId = await this.createExtensionSandbox(extensionId, manifest);
            // Load extension files
            await this.loadExtensionFiles(extensionId, sourcePath, manifest);
            // Set up permissions
            const permissions = new Set(manifest.permissions || []);
            const extensionInfo = {
                id: extensionId,
                manifest,
                path: sourcePath,
                enabled: true,
                installTime: new Date(),
                permissions,
                sandboxId
            };
            this.extensions.set(extensionId, extensionInfo);
            // Initialize background script if present
            if (manifest.background) {
                await this.initializeBackgroundScript(extensionInfo);
            }
            this.emit('extensionInstalled', extensionInfo);
            return extensionId;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Extension installation failed: ${error}`);
        }
    }
    /**
     * Uninstall an extension
     */
    async uninstallExtension(extensionId) {
        try {
            const extension = this.extensions.get(extensionId);
            if (!extension) {
                throw new Error('Extension not found');
            }
            // Clean up background script
            if (extension.manifest.background) {
                await this.cleanupBackgroundScript(extensionId);
            }
            // Destroy sandbox
            if (extension.sandboxId) {
                await this.securityFramework.destroySandbox(extension.sandboxId);
            }
            // Remove extension files
            await this.removeExtensionFiles(extensionId);
            // Clean up contexts
            this.activeContexts.delete(extensionId);
            this.extensions.delete(extensionId);
            this.emit('extensionUninstalled', extensionId);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Extension uninstallation failed: ${error}`);
        }
    }
    /**
     * Enable or disable an extension
     */
    async setExtensionEnabled(extensionId, enabled) {
        try {
            const extension = this.extensions.get(extensionId);
            if (!extension) {
                throw new Error('Extension not found');
            }
            extension.enabled = enabled;
            if (enabled) {
                // Reinitialize background script
                if (extension.manifest.background) {
                    await this.initializeBackgroundScript(extension);
                }
            }
            else {
                // Clean up background script
                await this.cleanupBackgroundScript(extensionId);
            }
            this.emit('extensionEnabledChanged', { extensionId, enabled });
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Extension enable/disable failed: ${error}`);
        }
    }
    /**
     * Handle Chrome extension API calls
     */
    async handleAPICall(request) {
        try {
            const extension = this.extensions.get(request.extensionId);
            if (!extension || !extension.enabled) {
                return { success: false, error: 'Extension not found or disabled' };
            }
            // Check permissions
            if (!this.checkAPIPermission(request, extension)) {
                return { success: false, error: 'Insufficient permissions' };
            }
            // Route to appropriate API handler
            const result = await this.routeAPICall(request);
            return { success: true, result };
        }
        catch (error) {
            this.emit('error', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Inject content scripts into matching pages
     */
    async injectContentScripts(tabId, url) {
        try {
            for (const [extensionId, extension] of this.extensions) {
                if (!extension.enabled || !extension.manifest.content_scripts) {
                    continue;
                }
                for (const script of extension.manifest.content_scripts) {
                    if (this.matchesContentScript(url, script)) {
                        await this.injectContentScript(extensionId, tabId, script);
                    }
                }
            }
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Content script injection failed: ${error}`);
        }
    }
    /**
     * Update an extension
     */
    async updateExtension(extensionId, newManifestPath, newSourcePath) {
        try {
            const extension = this.extensions.get(extensionId);
            if (!extension) {
                throw new Error('Extension not found');
            }
            const newManifest = await this.loadManifest(newManifestPath);
            await this.validateManifest(newManifest);
            // Backup current state
            const backup = { ...extension };
            try {
                // Update manifest
                extension.manifest = newManifest;
                extension.path = newSourcePath;
                extension.updateTime = new Date();
                // Reload extension files
                await this.loadExtensionFiles(extensionId, newSourcePath, newManifest);
                // Update permissions
                extension.permissions = new Set(newManifest.permissions || []);
                // Reinitialize background script
                if (newManifest.background) {
                    await this.cleanupBackgroundScript(extensionId);
                    await this.initializeBackgroundScript(extension);
                }
                this.emit('extensionUpdated', extension);
            }
            catch (updateError) {
                // Rollback on failure
                Object.assign(extension, backup);
                throw updateError;
            }
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Extension update failed: ${error}`);
        }
    }
    // Private methods
    async loadManifest(_manifestPath) {
        // In a real implementation, this would read and parse the manifest.json file
        // For now, return a mock manifest
        const manifest = {
            manifest_version: 2,
            name: 'Sample Extension',
            version: '1.0.0',
            description: 'Sample Chrome extension',
            permissions: ['tabs', 'storage'],
            content_scripts: [{
                    matches: ['<all_urls>'],
                    js: ['content.js'],
                    run_at: 'document_idle'
                }],
            background: {
                scripts: ['background.js'],
                persistent: false
            },
            browser_action: {
                default_title: 'Sample Extension',
                default_popup: 'popup.html'
            }
        };
        return manifest;
    }
    async validateManifest(manifest) {
        if (!manifest.name || !manifest.version) {
            throw new Error('Invalid manifest: missing name or version');
        }
        if (manifest.manifest_version !== 2 && manifest.manifest_version !== 3) {
            throw new Error('Unsupported manifest version');
        }
        // Additional validation logic would go here
    }
    generateExtensionId(manifest) {
        // Generate a unique ID based on manifest
        const hash = btoa(manifest.name + manifest.version).replace(/[^a-zA-Z0-9]/g, '');
        return `ext_${hash.substring(0, 16)}`;
    }
    async createExtensionSandbox(_extensionId, manifest) {
        const permissions = manifest.permissions || [];
        const sandboxConfig = {
            memoryLimit: 100 * 1024 * 1024, // 100MB
            cpuLimit: 0.1, // 10% CPU
            networkAccess: permissions.includes('webRequest') || permissions.includes('webRequestBlocking'),
            fileSystemAccess: permissions.includes('fileSystem'),
            permissions: permissions
        };
        return await this.securityFramework.createSandbox(sandboxConfig);
    }
    async loadExtensionFiles(_extensionId, _sourcePath, _manifest) {
        // In a real implementation, this would copy/load extension files
        // For now, just simulate the operation
        this.emit('extensionFilesLoaded', _extensionId);
    }
    async removeExtensionFiles(extensionId) {
        // Clean up extension files
        this.emit('extensionFilesRemoved', extensionId);
    }
    async initializeBackgroundScript(extension) {
        if (!extension.manifest.background)
            return;
        // Create background process
        const _processId = `bg_${extension.id}`;
        await this.processManager.createProcess(process_manager_1.ProcessType.Utility, {
            memoryLimit: 50 * 1024 * 1024, // 50MB for extensions
            cpuQuota: 0.05, // 5% CPU
            securityLevel: 'elevated'
        });
        this.emit('backgroundScriptInitialized', extension.id);
    }
    async cleanupBackgroundScript(extensionId) {
        const processId = `bg_${extensionId}`;
        await this.processManager.destroyProcess(processId);
        this.emit('backgroundScriptCleaned', extensionId);
    }
    initializeAPIHandlers() {
        // Chrome Extension APIs implementation
        this.apiHandlers.set('tabs', new Map([
            ['create', this.handleTabsCreate.bind(this)],
            ['update', this.handleTabsUpdate.bind(this)],
            ['remove', this.handleTabsRemove.bind(this)],
            ['query', this.handleTabsQuery.bind(this)],
            ['get', this.handleTabsGet.bind(this)]
        ]));
        this.apiHandlers.set('storage', new Map([
            ['local.set', this.handleStorageSet.bind(this)],
            ['local.get', this.handleStorageGet.bind(this)],
            ['local.remove', this.handleStorageRemove.bind(this)],
            ['sync.set', this.handleStorageSet.bind(this)],
            ['sync.get', this.handleStorageGet.bind(this)]
        ]));
        this.apiHandlers.set('runtime', new Map([
            ['sendMessage', this.handleRuntimeSendMessage.bind(this)],
            ['onMessage', this.handleRuntimeOnMessage.bind(this)],
            ['getManifest', this.handleRuntimeGetManifest.bind(this)]
        ]));
    }
    checkAPIPermission(request, extension) {
        // Check if extension has required permissions for the API
        const requiredPermissions = this.getRequiredPermissions(request.api);
        return requiredPermissions.every(perm => extension.permissions.has(perm));
    }
    getRequiredPermissions(api) {
        const permissionMap = {
            'tabs': ['tabs'],
            'storage': ['storage'],
            'runtime': [],
            'webRequest': ['webRequest'],
            'cookies': ['cookies']
        };
        return permissionMap[api] || [];
    }
    async routeAPICall(request) {
        const [api, method] = request.api.split('.');
        const handlerMap = this.apiHandlers.get(api);
        if (!handlerMap) {
            throw new Error(`Unknown API: ${api}`);
        }
        const handler = handlerMap.get(method);
        if (!handler) {
            throw new Error(`Unknown method: ${method} for API: ${api}`);
        }
        return await handler(request);
    }
    matchesContentScript(url, script) {
        // Simple URL matching - in reality this would be more complex
        return script.matches.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(url);
        });
    }
    async injectContentScript(extensionId, tabId, script) {
        // Inject content script into tab
        this.emit('contentScriptInjected', { extensionId, tabId, script });
    }
    // Chrome Extension API implementations
    async handleTabsCreate(_request) {
        // Implementation for chrome.tabs.create
        return { id: Math.random() };
    }
    async handleTabsUpdate(_request) {
        // Implementation for chrome.tabs.update
        return {};
    }
    async handleTabsRemove(_request) {
        // Implementation for chrome.tabs.remove
        return {};
    }
    async handleTabsQuery(_request) {
        // Implementation for chrome.tabs.query
        return [];
    }
    async handleTabsGet(_request) {
        // Implementation for chrome.tabs.get
        return {};
    }
    async handleStorageSet(_request) {
        // Implementation for chrome.storage.set
        return {};
    }
    async handleStorageGet(_request) {
        // Implementation for chrome.storage.get
        return {};
    }
    async handleStorageRemove(_request) {
        // Implementation for chrome.storage.remove
        return {};
    }
    async handleRuntimeSendMessage(_request) {
        // Implementation for chrome.runtime.sendMessage
        return {};
    }
    async handleRuntimeOnMessage(_request) {
        // Implementation for chrome.runtime.onMessage
        return {};
    }
    async handleRuntimeGetManifest(request) {
        const extension = this.extensions.get(request.extensionId);
        return extension?.manifest || null;
    }
}
exports.ExtensionManager = ExtensionManager;
//# sourceMappingURL=extension-manager.js.map