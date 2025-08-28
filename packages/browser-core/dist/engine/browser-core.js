"use strict";
// Aura Browser Core Engine - Main Integration
// Brings together all browser core components for Task 2 implementation
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultBrowserCoreConfig = exports.AuraBrowserCore = void 0;
exports.createBrowserCore = createBrowserCore;
const chromium_engine_1 = require("./chromium-engine");
const ai_integration_hooks_1 = require("./ai-integration-hooks");
const process_manager_1 = require("./process-manager");
const tab_manager_1 = require("./tab-manager");
const event_system_1 = require("./event-system");
// Main Browser Core Implementation
class AuraBrowserCore {
    constructor(nativeEngine, config) {
        this.initialized = false;
        this.nativeEngine = nativeEngine;
        this.config = config;
        // Initialize IPC first as it's needed by other components
        this.ipcManager = (0, process_manager_1.createIPCManager)();
        // Create process manager
        this.processManager = (0, process_manager_1.createProcessManager)(this.ipcManager);
        // Create event bus
        this.eventBus = (0, event_system_1.createEventBus)();
        // Create chromium engine wrapper
        this.chromiumEngine = (0, chromium_engine_1.createChromiumEngine)(nativeEngine);
        // Create AI integration hooks
        this.aiHooks = (0, ai_integration_hooks_1.createAIIntegrationHooks)();
        // Create tab manager with configuration
        const tabManagerConfig = {
            maxTabs: config.maxTabs,
            defaultSpaceId: 'default-space',
            suspensionStrategy: {
                type: 'time-based',
                threshold: 30, // 30 minutes
                gracePeriod: 5 // 5 minutes
            },
            memoryThreshold: config.memoryLimit,
            autoSaveState: true,
            enableAdvancedSearch: true,
            enableTabHistory: true,
            maxHistoryEntries: 1000,
            enableAIFeatures: config.enableAI
        };
        this.tabManager = (0, tab_manager_1.createTabManager)(this.processManager, tabManagerConfig);
        // Register event processors
        this.registerEventProcessors();
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Publish browser startup event
            await this.eventBus.publish({
                id: `startup_${Date.now()}`,
                type: 'browser-startup',
                timestamp: new Date(),
                source: 'browser-core',
                data: { config: this.config },
                metadata: {
                    priority: 'high',
                    correlationId: 'browser-startup'
                }
            });
            // Initialize native chromium engine
            await this.initializeNativeEngine();
            // Create default space and initial setup
            await this.initializeDefaultSpace();
            // Start background processes
            await this.startBackgroundProcesses();
            // Setup event forwarding between components
            this.setupEventForwarding();
            this.initialized = true;
            console.log('Aura Browser Core initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize browser core:', error);
            throw error;
        }
    }
    async shutdown() {
        if (!this.initialized) {
            return;
        }
        try {
            // Publish shutdown event
            await this.eventBus.publish({
                id: `shutdown_${Date.now()}`,
                type: 'browser-shutdown',
                timestamp: new Date(),
                source: 'browser-core',
                data: {},
                metadata: {
                    priority: 'high',
                    correlationId: 'browser-shutdown'
                }
            });
            // Shutdown components in reverse order
            await this.tabManager.optimizeMemory(); // Suspend all tabs
            // Destroy all processes
            const processes = await this.processManager.listProcesses();
            for (const process of processes) {
                await this.processManager.destroyProcess(process.id);
            }
            // Shutdown managers
            this.tabManager.destroy();
            this.processManager.destroy();
            this.eventBus.destroy();
            this.initialized = false;
            console.log('Aura Browser Core shutdown successfully');
        }
        catch (error) {
            console.error('Error during browser core shutdown:', error);
            throw error;
        }
    }
    async getStats() {
        const [tabs, processes] = await Promise.all([
            this.tabManager.listTabs(),
            this.processManager.listProcesses()
        ]);
        const activeTabs = tabs.filter(tab => !tab.suspended);
        const suspendedTabs = tabs.filter(tab => tab.suspended);
        const healthyProcesses = processes.filter(p => p.health === 'healthy');
        const degradedProcesses = processes.filter(p => p.health === 'degraded');
        const criticalProcesses = processes.filter(p => p.health === 'critical');
        // Calculate memory usage
        const totalMemoryUsed = processes.reduce((sum, p) => sum + p.memoryUsage, 0);
        const memoryLimit = this.config.memoryLimit * 1024 * 1024; // Convert to bytes
        return {
            tabs: {
                total: tabs.length,
                active: activeTabs.length,
                suspended: suspendedTabs.length
            },
            processes: {
                total: processes.length,
                healthy: healthyProcesses.length,
                degraded: degradedProcesses.length,
                critical: criticalProcesses.length
            },
            memory: {
                used: totalMemoryUsed,
                limit: memoryLimit,
                available: Math.max(0, memoryLimit - totalMemoryUsed)
            },
            performance: {
                averageLoadTime: 0, // Would be calculated from actual metrics
                averageMemoryPerTab: tabs.length > 0 ? totalMemoryUsed / tabs.length : 0,
                eventProcessingRate: 0 // Would be calculated from event bus metrics
            }
        };
    }
    async optimize() {
        // Run optimization across all components
        await Promise.all([
            this.tabManager.optimizeMemory(),
            this.processManager.monitorProcesses(),
            this.eventBus.getEvents() // This would trigger cleanup
        ]);
    }
    async initializeNativeEngine() {
        // This would initialize the native Chromium engine
        // For now, this is a placeholder
        console.log('Initializing native Chromium engine...');
    }
    async initializeDefaultSpace() {
        // Create default space if it doesn't exist
        try {
            await this.tabManager.createSpace('Default Workspace', {
                theme: 'default',
                layout: 'grid',
                autoSuspend: this.config.autoSuspendTabs,
                aiEnabled: this.config.enableAI
            });
        }
        catch (error) {
            // Space might already exist
            console.log('Default space already exists or failed to create:', error);
        }
    }
    async startBackgroundProcesses() {
        // Start essential background processes
        const processes = [
            { type: 'main', config: { securityLevel: 'elevated' } },
            { type: 'network', config: { securityLevel: 'standard' } },
            { type: 'gpu', config: { securityLevel: 'standard' } }
        ];
        for (const process of processes) {
            try {
                await this.processManager.createProcess(process.type, process.config);
            }
            catch (error) {
                console.warn(`Failed to start ${process.type} process:`, error);
            }
        }
        if (this.config.enableAI) {
            try {
                await this.processManager.createProcess('ai', {
                    securityLevel: 'elevated',
                    aiEnabled: true
                });
            }
            catch (error) {
                console.warn('Failed to start AI process:', error);
            }
        }
    }
    registerEventProcessors() {
        const tabProcessor = new event_system_1.TabEventProcessor();
        const processProcessor = new event_system_1.ProcessEventProcessor();
        const aiProcessor = new event_system_1.AIEventProcessor();
        this.eventBus.registerProcessor(tabProcessor);
        this.eventBus.registerProcessor(processProcessor);
        this.eventBus.registerProcessor(aiProcessor);
    }
    setupEventForwarding() {
        // Forward events from various components to the event bus
        this.setupTabEventForwarding();
        this.setupProcessEventForwarding();
        this.setupChromiumEventForwarding();
    }
    setupTabEventForwarding() {
        // Forward tab manager events to event bus
        const tabManager = this.tabManager;
        if (tabManager.emit) {
            const originalEmit = tabManager.emit.bind(tabManager);
            tabManager.emit = (event, data) => {
                // Forward to event bus
                this.eventBus.publish({
                    id: `tab_${Date.now()}`,
                    type: event,
                    timestamp: new Date(),
                    source: 'tab-manager',
                    data
                }).catch(error => console.warn('Failed to publish tab event:', error));
                // Call original emit
                return originalEmit(event, data);
            };
        }
    }
    setupProcessEventForwarding() {
        // Forward process manager events to event bus
        const processManager = this.processManager;
        if (processManager.emit) {
            const originalEmit = processManager.emit.bind(processManager);
            processManager.emit = (event, data) => {
                // Forward to event bus
                this.eventBus.publish({
                    id: `process_${Date.now()}`,
                    type: event,
                    timestamp: new Date(),
                    source: 'process-manager',
                    data
                }).catch(error => console.warn('Failed to publish process event:', error));
                // Call original emit
                return originalEmit(event, data);
            };
        }
    }
    setupChromiumEventForwarding() {
        // Forward chromium engine events to event bus
        const chromiumEngine = this.chromiumEngine;
        if (chromiumEngine.addEventListener) {
            // This would need to be implemented based on the actual event system
            // For now, this is a placeholder
        }
    }
}
exports.AuraBrowserCore = AuraBrowserCore;
// Factory function to create browser core
function createBrowserCore(nativeEngine, config) {
    return new AuraBrowserCore(nativeEngine, config);
}
// Default configuration
exports.defaultBrowserCoreConfig = {
    maxTabs: 100,
    maxProcesses: 20,
    memoryLimit: 1024, // 1GB
    enableAI: true,
    securityLevel: 'standard',
    autoSuspendTabs: true,
    eventStorageEnabled: true
};
//# sourceMappingURL=browser-core.js.map