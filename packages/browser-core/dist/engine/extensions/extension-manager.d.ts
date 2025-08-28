import { EventEmitter } from 'events';
import { AuraSecurityFramework } from '../security/security-framework';
import { AuraProcessManager } from '../process-manager';
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
    icons?: {
        [size: string]: string;
    };
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
    default_icon?: string | {
        [size: string]: string;
    };
    default_popup?: string;
}
export interface PageAction {
    default_title?: string;
    default_icon?: string | {
        [size: string]: string;
    };
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
export declare class ExtensionManager extends EventEmitter {
    private extensions;
    private activeContexts;
    private securityFramework;
    private processManager;
    private apiHandlers;
    constructor(securityFramework: AuraSecurityFramework, processManager: AuraProcessManager);
    /**
     * Install an extension from manifest and source files
     */
    installExtension(manifestPath: string, sourcePath: string): Promise<string>;
    /**
     * Uninstall an extension
     */
    uninstallExtension(extensionId: string): Promise<void>;
    /**
     * Enable or disable an extension
     */
    setExtensionEnabled(extensionId: string, enabled: boolean): Promise<void>;
    /**
     * Handle Chrome extension API calls
     */
    handleAPICall(request: APIRequest): Promise<APIResponse>;
    /**
     * Inject content scripts into matching pages
     */
    injectContentScripts(tabId: string, url: string): Promise<void>;
    /**
     * Update an extension
     */
    updateExtension(extensionId: string, newManifestPath: string, newSourcePath: string): Promise<void>;
    private loadManifest;
    private validateManifest;
    private generateExtensionId;
    private createExtensionSandbox;
    private loadExtensionFiles;
    private removeExtensionFiles;
    private initializeBackgroundScript;
    private cleanupBackgroundScript;
    private initializeAPIHandlers;
    private checkAPIPermission;
    private getRequiredPermissions;
    private routeAPICall;
    private matchesContentScript;
    private injectContentScript;
    private handleTabsCreate;
    private handleTabsUpdate;
    private handleTabsRemove;
    private handleTabsQuery;
    private handleTabsGet;
    private handleStorageSet;
    private handleStorageGet;
    private handleStorageRemove;
    private handleRuntimeSendMessage;
    private handleRuntimeOnMessage;
    private handleRuntimeGetManifest;
}
//# sourceMappingURL=extension-manager.d.ts.map