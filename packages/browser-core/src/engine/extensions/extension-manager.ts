import { EventEmitter } from 'events';
import { AuraSecurityFramework } from '../security/security-framework';
import { AuraProcessManager, ProcessType } from '../process-manager';

/**
 * ExtensionManager - Chrome Extension Compatibility Layer for Aura Browser
 *
 * Provides comprehensive Chrome extension API compatibility with AI enhancements
 */

export interface ExtensionManifest {
  manifest_version: 2 | 3;
  name: string;
  version: string;
  description?: string;
  permissions?: string[];
  content_scripts?: ContentScript[];
  background?: BackgroundScript;
  browser_action?: BrowserAction;
  page_action?: PageAction;
  options_ui?: OptionsUI;
  web_accessible_resources?: string[];
  content_security_policy?: string;
  icons?: { [size: string]: string };
  author?: string;
  homepage_url?: string;
}

export interface ContentScript {
  matches: string[];
  js?: string[];
  css?: string[];
  run_at?: 'document_start' | 'document_end' | 'document_idle';
  all_frames?: boolean;
  match_about_blank?: boolean;
}

export interface BackgroundScript {
  scripts?: string[];
  page?: string;
  persistent?: boolean;
}

export interface BrowserAction {
  default_title?: string;
  default_icon?: string | { [size: string]: string };
  default_popup?: string;
}

export interface PageAction {
  default_title?: string;
  default_icon?: string | { [size: string]: string };
  default_popup?: string;
}

export interface OptionsUI {
  page: string;
  open_in_tab?: boolean;
}

export interface ExtensionInfo {
  id: string;
  manifest: ExtensionManifest;
  path: string;
  enabled: boolean;
  installTime: Date;
  updateTime?: Date;
  permissions: Set<string>;
  sandboxId?: string;
}

export interface ExtensionContext {
  extensionId: string;
  tabId?: string;
  frameId?: number;
  url?: string;
  permissions: Set<string>;
}

export interface APIRequest {
  extensionId: string;
  api: string;
  method: string;
  args: any[];
  context: ExtensionContext;
}

export interface APIResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export class ExtensionManager extends EventEmitter {
  private extensions: Map<string, ExtensionInfo> = new Map();
  private activeContexts: Map<string, ExtensionContext> = new Map();
  private securityFramework: AuraSecurityFramework;
  private processManager: AuraProcessManager;
  private apiHandlers: Map<string, Map<string, Function>> = new Map();

  constructor(
    securityFramework: AuraSecurityFramework,
    processManager: AuraProcessManager
  ) {
    super();
    this.securityFramework = securityFramework;
    this.processManager = processManager;
    this.initializeAPIHandlers();
  }

  /**
   * Install an extension from manifest and source files
   */
  async installExtension(
    manifestPath: string,
    sourcePath: string
  ): Promise<string> {
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

      const extensionInfo: ExtensionInfo = {
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
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Extension installation failed: ${error}`);
    }
  }

  /**
   * Uninstall an extension
   */
  async uninstallExtension(extensionId: string): Promise<void> {
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
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Extension uninstallation failed: ${error}`);
    }
  }

  /**
   * Enable or disable an extension
   */
  async setExtensionEnabled(extensionId: string, enabled: boolean): Promise<void> {
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
      } else {
        // Clean up background script
        await this.cleanupBackgroundScript(extensionId);
      }

      this.emit('extensionEnabledChanged', { extensionId, enabled });
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Extension enable/disable failed: ${error}`);
    }
  }

  /**
   * Handle Chrome extension API calls
   */
  async handleAPICall(request: APIRequest): Promise<APIResponse> {
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
    } catch (error) {
      this.emit('error', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Inject content scripts into matching pages
   */
  async injectContentScripts(tabId: string, url: string): Promise<void> {
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
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Content script injection failed: ${error}`);
    }
  }

  /**
   * Update an extension
   */
  async updateExtension(extensionId: string, newManifestPath: string, newSourcePath: string): Promise<void> {
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
      } catch (updateError) {
        // Rollback on failure
        Object.assign(extension, backup);
        throw updateError;
      }
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Extension update failed: ${error}`);
    }
  }

  // Private methods

  private async loadManifest(_manifestPath: string): Promise<ExtensionManifest> {
    // In a real implementation, this would read and parse the manifest.json file
    // For now, return a mock manifest
    const manifest: ExtensionManifest = {
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

  private async validateManifest(manifest: ExtensionManifest): Promise<void> {
    if (!manifest.name || !manifest.version) {
      throw new Error('Invalid manifest: missing name or version');
    }

    if (manifest.manifest_version !== 2 && manifest.manifest_version !== 3) {
      throw new Error('Unsupported manifest version');
    }

    // Additional validation logic would go here
  }

  private generateExtensionId(manifest: ExtensionManifest): string {
    // Generate a unique ID based on manifest
    const hash = btoa(manifest.name + manifest.version).replace(/[^a-zA-Z0-9]/g, '');
    return `ext_${hash.substring(0, 16)}`;
  }

  private async createExtensionSandbox(_extensionId: string, manifest: ExtensionManifest): Promise<string> {
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

  private async loadExtensionFiles(
    _extensionId: string,
    _sourcePath: string,
    _manifest: ExtensionManifest
  ): Promise<void> {
    // In a real implementation, this would copy/load extension files
    // For now, just simulate the operation
    this.emit('extensionFilesLoaded', _extensionId);
  }

  private async removeExtensionFiles(extensionId: string): Promise<void> {
    // Clean up extension files
    this.emit('extensionFilesRemoved', extensionId);
  }

  private async initializeBackgroundScript(extension: ExtensionInfo): Promise<void> {
    if (!extension.manifest.background) return;

    // Create background process
    const _processId = `bg_${extension.id}`;
    await this.processManager.createProcess(ProcessType.Utility, {
      memoryLimit: 50 * 1024 * 1024, // 50MB for extensions
      cpuQuota: 0.05, // 5% CPU
      securityLevel: 'elevated' as any
    });

    this.emit('backgroundScriptInitialized', extension.id);
  }

  private async cleanupBackgroundScript(extensionId: string): Promise<void> {
    const processId = `bg_${extensionId}`;
    await this.processManager.destroyProcess(processId);
    this.emit('backgroundScriptCleaned', extensionId);
  }

  private initializeAPIHandlers(): void {
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

  private checkAPIPermission(request: APIRequest, extension: ExtensionInfo): boolean {
    // Check if extension has required permissions for the API
    const requiredPermissions = this.getRequiredPermissions(request.api);
    return requiredPermissions.every(perm => extension.permissions.has(perm));
  }

  private getRequiredPermissions(api: string): string[] {
    const permissionMap: { [api: string]: string[] } = {
      'tabs': ['tabs'],
      'storage': ['storage'],
      'runtime': [],
      'webRequest': ['webRequest'],
      'cookies': ['cookies']
    };

    return permissionMap[api] || [];
  }

  private async routeAPICall(request: APIRequest): Promise<any> {
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

  private matchesContentScript(url: string, script: ContentScript): boolean {
    // Simple URL matching - in reality this would be more complex
    return script.matches.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    });
  }

  private async injectContentScript(
    extensionId: string,
    tabId: string,
    script: ContentScript
  ): Promise<void> {
    // Inject content script into tab
    this.emit('contentScriptInjected', { extensionId, tabId, script });
  }

  // Chrome Extension API implementations

  private async handleTabsCreate(_request: APIRequest): Promise<any> {
    // Implementation for chrome.tabs.create
    return { id: Math.random() };
  }

  private async handleTabsUpdate(_request: APIRequest): Promise<any> {
    // Implementation for chrome.tabs.update
    return {};
  }

  private async handleTabsRemove(_request: APIRequest): Promise<any> {
    // Implementation for chrome.tabs.remove
    return {};
  }

  private async handleTabsQuery(_request: APIRequest): Promise<any> {
    // Implementation for chrome.tabs.query
    return [];
  }

  private async handleTabsGet(_request: APIRequest): Promise<any> {
    // Implementation for chrome.tabs.get
    return {};
  }

  private async handleStorageSet(_request: APIRequest): Promise<any> {
    // Implementation for chrome.storage.set
    return {};
  }

  private async handleStorageGet(_request: APIRequest): Promise<any> {
    // Implementation for chrome.storage.get
    return {};
  }

  private async handleStorageRemove(_request: APIRequest): Promise<any> {
    // Implementation for chrome.storage.remove
    return {};
  }

  private async handleRuntimeSendMessage(_request: APIRequest): Promise<any> {
    // Implementation for chrome.runtime.sendMessage
    return {};
  }

  private async handleRuntimeOnMessage(_request: APIRequest): Promise<any> {
    // Implementation for chrome.runtime.onMessage
    return {};
  }

  private async handleRuntimeGetManifest(request: APIRequest): Promise<any> {
    const extension = this.extensions.get(request.extensionId);
    return extension?.manifest || null;
  }
}
