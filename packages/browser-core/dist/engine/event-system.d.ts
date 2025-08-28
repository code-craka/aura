import { EventEmitter } from 'events';
import { Tab } from './chromium-engine';
import { ProcessInfo, ProcessHealth } from './process-manager';
export interface BrowserEvent {
    id: string;
    type: BrowserEventType;
    timestamp: Date;
    source: string;
    data: any;
    metadata?: EventMetadata;
}
export declare enum BrowserEventType {
    TAB_CREATED = "tab-created",
    TAB_DESTROYED = "tab-destroyed",
    TAB_NAVIGATED = "tab-navigated",
    TAB_LOADING = "tab-loading",
    TAB_LOADED = "tab-loaded",
    TAB_ERROR = "tab-error",
    TAB_SUSPENDED = "tab-suspended",
    TAB_RESTORED = "tab-restored",
    TAB_MOVED = "tab-moved",
    TAB_ACTIVATED = "tab-activated",
    PROCESS_CREATED = "process-created",
    PROCESS_DESTROYED = "process-destroyed",
    PROCESS_HEALTH_CHANGED = "process-health-changed",
    PROCESS_RESOURCE_ALLOCATION = "process-resource-allocation",
    GROUP_CREATED = "group-created",
    GROUP_DESTROYED = "group-destroyed",
    GROUP_UPDATED = "group-updated",
    SPACE_CREATED = "space-created",
    SPACE_DESTROYED = "space-destroyed",
    SPACE_SWITCHED = "space-switched",
    SPACE_UPDATED = "space-updated",
    AI_CONTENT_READY = "ai-content-ready",
    AI_CONTEXT_UPDATED = "ai-context-updated",
    AI_ACTION_REQUESTED = "ai-action-requested",
    AI_ACTION_COMPLETED = "ai-action-completed",
    AI_PERMISSION_REQUESTED = "ai-permission-requested",
    SECURITY_THREAT_DETECTED = "security-threat-detected",
    SECURITY_POLICY_VIOLATION = "security-policy-violation",
    PRIVACY_DATA_ACCESSED = "privacy-data-accessed",
    PERFORMANCE_METRIC = "performance-metric",
    MEMORY_WARNING = "memory-warning",
    CPU_WARNING = "cpu-warning",
    NETWORK_WARNING = "network-warning",
    BROWSER_STARTUP = "browser-startup",
    BROWSER_SHUTDOWN = "browser-shutdown",
    EXTENSION_LOADED = "extension-loaded",
    EXTENSION_UNLOADED = "extension-unloaded"
}
export interface EventMetadata {
    priority: EventPriority;
    ttl?: number;
    target?: string;
    correlationId?: string;
    userId?: string;
    sessionId?: string;
}
export declare enum EventPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface EventFilter {
    types?: BrowserEventType[];
    sources?: string[];
    priorities?: EventPriority[];
    timeRange?: {
        start: Date;
        end: Date;
    };
    data?: Record<string, any>;
}
export interface EventSubscription {
    id: string;
    filter: EventFilter;
    handler: (event: BrowserEvent) => void;
    active: boolean;
    createdAt: Date;
}
export interface EventBus {
    publish(event: BrowserEvent): Promise<void>;
    subscribe(filter: EventFilter, handler: (event: BrowserEvent) => void): EventSubscription;
    unsubscribe(subscriptionId: string): void;
    getEvents(filter?: EventFilter): Promise<BrowserEvent[]>;
    getSubscriptions(): EventSubscription[];
}
export interface EventProcessor {
    process(event: BrowserEvent): Promise<void>;
    canProcess(event: BrowserEvent): boolean;
}
export interface EventStorage {
    store(event: BrowserEvent): Promise<void>;
    retrieve(filter?: EventFilter): Promise<BrowserEvent[]>;
    cleanup(olderThan: Date): Promise<void>;
}
export declare class AuraEventBus extends EventEmitter implements EventBus {
    private subscriptions;
    private processors;
    private storage?;
    private eventQueue;
    private processingTimer;
    constructor(storage?: EventStorage);
    publish(event: BrowserEvent): Promise<void>;
    subscribe(filter: EventFilter, handler: (event: BrowserEvent) => void): EventSubscription;
    unsubscribe(subscriptionId: string): void;
    getEvents(filter?: EventFilter): Promise<BrowserEvent[]>;
    getSubscriptions(): EventSubscription[];
    registerProcessor(processor: EventProcessor): void;
    unregisterProcessor(processor: EventProcessor): void;
    private processEvent;
    private matchesFilter;
    private startEventProcessing;
    destroy(): void;
}
export declare class TabEventProcessor implements EventProcessor {
    private tabState;
    canProcess(event: BrowserEvent): boolean;
    process(event: BrowserEvent): Promise<void>;
    getTabState(tabId: string): Tab | undefined;
    getAllTabs(): Tab[];
}
export declare class ProcessEventProcessor implements EventProcessor {
    private processState;
    canProcess(event: BrowserEvent): boolean;
    process(event: BrowserEvent): Promise<void>;
    getProcessState(processId: string): ProcessInfo | undefined;
    getAllProcesses(): ProcessInfo[];
    getProcessesByHealth(health: ProcessHealth): ProcessInfo[];
}
export declare class AIEventProcessor implements EventProcessor {
    private aiContexts;
    canProcess(event: BrowserEvent): boolean;
    process(event: BrowserEvent): Promise<void>;
    getAIContext(tabId: string): any;
    getAllAIContexts(): Map<string, any>;
}
export declare function createEventBus(storage?: EventStorage): EventBus;
export declare function createTabEventProcessor(): TabEventProcessor;
export declare function createProcessEventProcessor(): ProcessEventProcessor;
export declare function createAIEventProcessor(): AIEventProcessor;
//# sourceMappingURL=event-system.d.ts.map