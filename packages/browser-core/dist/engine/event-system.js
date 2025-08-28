"use strict";
// Browser Event System for Aura Browser
// Comprehensive event management for browser state changes and AI integration
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIEventProcessor = exports.ProcessEventProcessor = exports.TabEventProcessor = exports.AuraEventBus = exports.EventPriority = exports.BrowserEventType = void 0;
exports.createEventBus = createEventBus;
exports.createTabEventProcessor = createTabEventProcessor;
exports.createProcessEventProcessor = createProcessEventProcessor;
exports.createAIEventProcessor = createAIEventProcessor;
const events_1 = require("events");
const chromium_engine_1 = require("./chromium-engine");
var BrowserEventType;
(function (BrowserEventType) {
    // Tab Events
    BrowserEventType["TAB_CREATED"] = "tab-created";
    BrowserEventType["TAB_DESTROYED"] = "tab-destroyed";
    BrowserEventType["TAB_NAVIGATED"] = "tab-navigated";
    BrowserEventType["TAB_LOADING"] = "tab-loading";
    BrowserEventType["TAB_LOADED"] = "tab-loaded";
    BrowserEventType["TAB_ERROR"] = "tab-error";
    BrowserEventType["TAB_SUSPENDED"] = "tab-suspended";
    BrowserEventType["TAB_RESTORED"] = "tab-restored";
    BrowserEventType["TAB_MOVED"] = "tab-moved";
    BrowserEventType["TAB_ACTIVATED"] = "tab-activated";
    // Process Events
    BrowserEventType["PROCESS_CREATED"] = "process-created";
    BrowserEventType["PROCESS_DESTROYED"] = "process-destroyed";
    BrowserEventType["PROCESS_HEALTH_CHANGED"] = "process-health-changed";
    BrowserEventType["PROCESS_RESOURCE_ALLOCATION"] = "process-resource-allocation";
    // Group and Space Events
    BrowserEventType["GROUP_CREATED"] = "group-created";
    BrowserEventType["GROUP_DESTROYED"] = "group-destroyed";
    BrowserEventType["GROUP_UPDATED"] = "group-updated";
    BrowserEventType["SPACE_CREATED"] = "space-created";
    BrowserEventType["SPACE_DESTROYED"] = "space-destroyed";
    BrowserEventType["SPACE_SWITCHED"] = "space-switched";
    BrowserEventType["SPACE_UPDATED"] = "space-updated";
    // AI Integration Events
    BrowserEventType["AI_CONTENT_READY"] = "ai-content-ready";
    BrowserEventType["AI_CONTEXT_UPDATED"] = "ai-context-updated";
    BrowserEventType["AI_ACTION_REQUESTED"] = "ai-action-requested";
    BrowserEventType["AI_ACTION_COMPLETED"] = "ai-action-completed";
    BrowserEventType["AI_PERMISSION_REQUESTED"] = "ai-permission-requested";
    // Security Events
    BrowserEventType["SECURITY_THREAT_DETECTED"] = "security-threat-detected";
    BrowserEventType["SECURITY_POLICY_VIOLATION"] = "security-policy-violation";
    BrowserEventType["PRIVACY_DATA_ACCESSED"] = "privacy-data-accessed";
    // Performance Events
    BrowserEventType["PERFORMANCE_METRIC"] = "performance-metric";
    BrowserEventType["MEMORY_WARNING"] = "memory-warning";
    BrowserEventType["CPU_WARNING"] = "cpu-warning";
    BrowserEventType["NETWORK_WARNING"] = "network-warning";
    // System Events
    BrowserEventType["BROWSER_STARTUP"] = "browser-startup";
    BrowserEventType["BROWSER_SHUTDOWN"] = "browser-shutdown";
    BrowserEventType["EXTENSION_LOADED"] = "extension-loaded";
    BrowserEventType["EXTENSION_UNLOADED"] = "extension-unloaded";
})(BrowserEventType || (exports.BrowserEventType = BrowserEventType = {}));
var EventPriority;
(function (EventPriority) {
    EventPriority["LOW"] = "low";
    EventPriority["NORMAL"] = "normal";
    EventPriority["HIGH"] = "high";
    EventPriority["CRITICAL"] = "critical";
})(EventPriority || (exports.EventPriority = EventPriority = {}));
// Main Event Bus Implementation
class AuraEventBus extends events_1.EventEmitter {
    constructor(storage) {
        super();
        this.subscriptions = new Map();
        this.processors = [];
        this.eventQueue = [];
        this.processingTimer = null;
        this.storage = storage;
        this.startEventProcessing();
    }
    async publish(event) {
        // Add to queue for processing
        this.eventQueue.push(event);
        // Store event if storage is available
        if (this.storage) {
            try {
                await this.storage.store(event);
            }
            catch (error) {
                console.warn('Failed to store event:', error);
            }
        }
        // Emit immediately for real-time subscribers
        this.emit('event-published', event);
        // Process event through registered processors
        this.processEvent(event).catch(error => {
            console.error('Event processing error:', error);
        });
    }
    subscribe(filter, handler) {
        const subscription = {
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            filter,
            handler,
            active: true,
            createdAt: new Date()
        };
        this.subscriptions.set(subscription.id, subscription);
        return subscription;
    }
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.active = false;
            this.subscriptions.delete(subscriptionId);
        }
    }
    async getEvents(filter) {
        if (this.storage) {
            return await this.storage.retrieve(filter);
        }
        return [];
    }
    getSubscriptions() {
        return Array.from(this.subscriptions.values()).filter(sub => sub.active);
    }
    registerProcessor(processor) {
        this.processors.push(processor);
    }
    unregisterProcessor(processor) {
        const index = this.processors.indexOf(processor);
        if (index > -1) {
            this.processors.splice(index, 1);
        }
    }
    async processEvent(event) {
        // Find matching subscriptions
        const matchingSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.active && this.matchesFilter(event, sub.filter));
        // Call handlers
        for (const subscription of matchingSubscriptions) {
            try {
                subscription.handler(event);
            }
            catch (error) {
                console.error(`Event handler error for subscription ${subscription.id}:`, error);
            }
        }
        // Process through registered processors
        for (const processor of this.processors) {
            if (processor.canProcess(event)) {
                try {
                    await processor.process(event);
                }
                catch (error) {
                    console.error('Event processor error:', error);
                }
            }
        }
    }
    matchesFilter(event, filter) {
        // Check event types
        if (filter.types && !filter.types.includes(event.type)) {
            return false;
        }
        // Check sources
        if (filter.sources && !filter.sources.includes(event.source)) {
            return false;
        }
        // Check priorities
        if (filter.priorities && !filter.priorities.includes(event.metadata?.priority || EventPriority.NORMAL)) {
            return false;
        }
        // Check time range
        if (filter.timeRange) {
            const eventTime = event.timestamp.getTime();
            const startTime = filter.timeRange.start.getTime();
            const endTime = filter.timeRange.end.getTime();
            if (eventTime < startTime || eventTime > endTime) {
                return false;
            }
        }
        // Check custom data filters
        if (filter.data) {
            for (const [key, value] of Object.entries(filter.data)) {
                if (!(key in event.data) || event.data[key] !== value) {
                    return false;
                }
            }
        }
        return true;
    }
    startEventProcessing() {
        this.processingTimer = setInterval(() => {
            if (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                if (event) {
                    this.processEvent(event).catch(error => {
                        console.error('Queued event processing error:', error);
                    });
                }
            }
        }, 10); // Process events every 10ms
    }
    destroy() {
        if (this.processingTimer) {
            clearInterval(this.processingTimer);
        }
        this.subscriptions.clear();
        this.processors.length = 0;
        this.eventQueue.length = 0;
    }
}
exports.AuraEventBus = AuraEventBus;
// Event Processors for specific event types
class TabEventProcessor {
    constructor() {
        this.tabState = new Map();
    }
    canProcess(event) {
        return [
            BrowserEventType.TAB_CREATED,
            BrowserEventType.TAB_DESTROYED,
            BrowserEventType.TAB_NAVIGATED,
            BrowserEventType.TAB_LOADING,
            BrowserEventType.TAB_LOADED,
            BrowserEventType.TAB_SUSPENDED,
            BrowserEventType.TAB_RESTORED
        ].includes(event.type);
    }
    async process(event) {
        switch (event.type) {
            case BrowserEventType.TAB_CREATED:
                this.tabState.set(event.data.id, event.data);
                break;
            case BrowserEventType.TAB_DESTROYED:
                this.tabState.delete(event.data.id);
                break;
            case BrowserEventType.TAB_NAVIGATED:
                const tab = this.tabState.get(event.data.tabId);
                if (tab) {
                    tab.url = event.data.url;
                    tab.title = event.data.title || 'Loading...';
                }
                break;
            case BrowserEventType.TAB_LOADING:
                const loadingTab = this.tabState.get(event.data.tabId);
                if (loadingTab) {
                    loadingTab.status = chromium_engine_1.TabStatus.Loading;
                }
                break;
            case BrowserEventType.TAB_LOADED:
                const loadedTab = this.tabState.get(event.data.tabId);
                if (loadedTab) {
                    loadedTab.status = chromium_engine_1.TabStatus.Complete;
                    loadedTab.title = event.data.title || loadedTab.title;
                }
                break;
            case BrowserEventType.TAB_SUSPENDED:
                const suspendedTab = this.tabState.get(event.data.id);
                if (suspendedTab) {
                    suspendedTab.suspended = true;
                }
                break;
            case BrowserEventType.TAB_RESTORED:
                const restoredTab = this.tabState.get(event.data.id);
                if (restoredTab) {
                    restoredTab.suspended = false;
                }
                break;
        }
    }
    getTabState(tabId) {
        return this.tabState.get(tabId);
    }
    getAllTabs() {
        return Array.from(this.tabState.values());
    }
}
exports.TabEventProcessor = TabEventProcessor;
class ProcessEventProcessor {
    constructor() {
        this.processState = new Map();
    }
    canProcess(event) {
        return [
            BrowserEventType.PROCESS_CREATED,
            BrowserEventType.PROCESS_DESTROYED,
            BrowserEventType.PROCESS_HEALTH_CHANGED,
            BrowserEventType.PROCESS_RESOURCE_ALLOCATION
        ].includes(event.type);
    }
    async process(event) {
        switch (event.type) {
            case BrowserEventType.PROCESS_CREATED:
                this.processState.set(event.data.id, event.data);
                break;
            case BrowserEventType.PROCESS_DESTROYED:
                this.processState.delete(event.data.id);
                break;
            case BrowserEventType.PROCESS_HEALTH_CHANGED:
                const process = this.processState.get(event.data.process.id);
                if (process) {
                    process.health = event.data.newHealth;
                }
                break;
            case BrowserEventType.PROCESS_RESOURCE_ALLOCATION:
                // Update process resource allocation
                const allocatedProcess = this.processState.get(event.data.processId);
                if (allocatedProcess) {
                    // This would update the process with new resource limits
                }
                break;
        }
    }
    getProcessState(processId) {
        return this.processState.get(processId);
    }
    getAllProcesses() {
        return Array.from(this.processState.values());
    }
    getProcessesByHealth(health) {
        return Array.from(this.processState.values()).filter(p => p.health === health);
    }
}
exports.ProcessEventProcessor = ProcessEventProcessor;
class AIEventProcessor {
    constructor() {
        this.aiContexts = new Map();
    }
    canProcess(event) {
        return [
            BrowserEventType.AI_CONTENT_READY,
            BrowserEventType.AI_CONTEXT_UPDATED,
            BrowserEventType.AI_ACTION_REQUESTED,
            BrowserEventType.AI_ACTION_COMPLETED,
            BrowserEventType.AI_PERMISSION_REQUESTED
        ].includes(event.type);
    }
    async process(event) {
        switch (event.type) {
            case BrowserEventType.AI_CONTENT_READY:
                this.aiContexts.set(event.data.tabId, event.data.context);
                break;
            case BrowserEventType.AI_CONTEXT_UPDATED:
                const existingContext = this.aiContexts.get(event.data.tabId) || {};
                this.aiContexts.set(event.data.tabId, { ...existingContext, ...event.data.updates });
                break;
            case BrowserEventType.AI_ACTION_REQUESTED:
                // Track pending AI actions
                break;
            case BrowserEventType.AI_ACTION_COMPLETED:
                // Update action completion status
                break;
            case BrowserEventType.AI_PERMISSION_REQUESTED:
                // Track permission requests
                break;
        }
    }
    getAIContext(tabId) {
        return this.aiContexts.get(tabId);
    }
    getAllAIContexts() {
        return new Map(this.aiContexts);
    }
}
exports.AIEventProcessor = AIEventProcessor;
// Factory functions
function createEventBus(storage) {
    return new AuraEventBus(storage);
}
function createTabEventProcessor() {
    return new TabEventProcessor();
}
function createProcessEventProcessor() {
    return new ProcessEventProcessor();
}
function createAIEventProcessor() {
    return new AIEventProcessor();
}
//# sourceMappingURL=event-system.js.map