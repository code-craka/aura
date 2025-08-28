import { ChromiumEngine, NativeChromiumEngine } from './chromium-engine';
import { AIIntegrationHooks } from './ai-integration-hooks';
import { ProcessManager, IPCManager } from './process-manager';
import { TabManager } from './tab-manager';
import { EventBus } from './event-system';
export interface BrowserCoreConfig {
    maxTabs: number;
    maxProcesses: number;
    memoryLimit: number;
    enableAI: boolean;
    securityLevel: 'standard' | 'elevated' | 'restricted';
    autoSuspendTabs: boolean;
    eventStorageEnabled: boolean;
}
export interface BrowserCore {
    readonly chromiumEngine: ChromiumEngine;
    readonly aiHooks: AIIntegrationHooks;
    readonly processManager: ProcessManager;
    readonly tabManager: TabManager;
    readonly eventBus: EventBus;
    readonly ipcManager: IPCManager;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getStats(): Promise<BrowserStats>;
    optimize(): Promise<void>;
}
export interface BrowserStats {
    tabs: {
        total: number;
        active: number;
        suspended: number;
    };
    processes: {
        total: number;
        healthy: number;
        degraded: number;
        critical: number;
    };
    memory: {
        used: number;
        limit: number;
        available: number;
    };
    performance: {
        averageLoadTime: number;
        averageMemoryPerTab: number;
        eventProcessingRate: number;
    };
}
export declare class AuraBrowserCore implements BrowserCore {
    readonly chromiumEngine: ChromiumEngine;
    readonly aiHooks: AIIntegrationHooks;
    readonly processManager: ProcessManager;
    readonly tabManager: TabManager;
    readonly eventBus: EventBus;
    readonly ipcManager: IPCManager;
    private config;
    private initialized;
    private nativeEngine;
    constructor(nativeEngine: NativeChromiumEngine, config: BrowserCoreConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getStats(): Promise<BrowserStats>;
    optimize(): Promise<void>;
    private initializeNativeEngine;
    private initializeDefaultSpace;
    private startBackgroundProcesses;
    private registerEventProcessors;
    private setupEventForwarding;
    private setupTabEventForwarding;
    private setupProcessEventForwarding;
    private setupChromiumEventForwarding;
}
export declare function createBrowserCore(nativeEngine: NativeChromiumEngine, config: BrowserCoreConfig): BrowserCore;
export declare const defaultBrowserCoreConfig: BrowserCoreConfig;
//# sourceMappingURL=browser-core.d.ts.map