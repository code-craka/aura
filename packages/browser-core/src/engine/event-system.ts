// Browser Event System for Aura Browser
// Comprehensive event management for browser state changes and AI integration

import { EventEmitter } from 'events';
import { Tab, TabStatus } from './chromium-engine';
import { ProcessInfo, ProcessHealth } from './process-manager';
import { TabGroup, Space } from './tab-manager';

export interface BrowserEvent {
  id: string;
  type: BrowserEventType;
  timestamp: Date;
  source: string; // Process or component that generated the event
  data: any;
  metadata?: EventMetadata;
}

export enum BrowserEventType {
  // Tab Events
  TAB_CREATED = 'tab-created',
  TAB_DESTROYED = 'tab-destroyed',
  TAB_NAVIGATED = 'tab-navigated',
  TAB_LOADING = 'tab-loading',
  TAB_LOADED = 'tab-loaded',
  TAB_ERROR = 'tab-error',
  TAB_SUSPENDED = 'tab-suspended',
  TAB_RESTORED = 'tab-restored',
  TAB_MOVED = 'tab-moved',
  TAB_ACTIVATED = 'tab-activated',

  // Process Events
  PROCESS_CREATED = 'process-created',
  PROCESS_DESTROYED = 'process-destroyed',
  PROCESS_HEALTH_CHANGED = 'process-health-changed',
  PROCESS_RESOURCE_ALLOCATION = 'process-resource-allocation',

  // Group and Space Events
  GROUP_CREATED = 'group-created',
  GROUP_DESTROYED = 'group-destroyed',
  GROUP_UPDATED = 'group-updated',
  SPACE_CREATED = 'space-created',
  SPACE_DESTROYED = 'space-destroyed',
  SPACE_SWITCHED = 'space-switched',
  SPACE_UPDATED = 'space-updated',

  // AI Integration Events
  AI_CONTENT_READY = 'ai-content-ready',
  AI_CONTEXT_UPDATED = 'ai-context-updated',
  AI_ACTION_REQUESTED = 'ai-action-requested',
  AI_ACTION_COMPLETED = 'ai-action-completed',
  AI_PERMISSION_REQUESTED = 'ai-permission-requested',

  // Security Events
  SECURITY_THREAT_DETECTED = 'security-threat-detected',
  SECURITY_POLICY_VIOLATION = 'security-policy-violation',
  PRIVACY_DATA_ACCESSED = 'privacy-data-accessed',

  // Performance Events
  PERFORMANCE_METRIC = 'performance-metric',
  MEMORY_WARNING = 'memory-warning',
  CPU_WARNING = 'cpu-warning',
  NETWORK_WARNING = 'network-warning',

  // System Events
  BROWSER_STARTUP = 'browser-startup',
  BROWSER_SHUTDOWN = 'browser-shutdown',
  EXTENSION_LOADED = 'extension-loaded',
  EXTENSION_UNLOADED = 'extension-unloaded'
}

export interface EventMetadata {
  priority: EventPriority;
  ttl?: number; // Time to live in milliseconds
  target?: string; // Specific component this event is targeted at
  correlationId?: string; // For correlating related events
  userId?: string;
  sessionId?: string;
}

export enum EventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
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

// Main Event Bus Implementation
export class AuraEventBus extends EventEmitter implements EventBus {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private processors: EventProcessor[] = [];
  private storage?: EventStorage;
  private eventQueue: BrowserEvent[] = [];
  private processingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(storage?: EventStorage) {
    super();
    this.storage = storage;
    this.startEventProcessing();
  }

  async publish(event: BrowserEvent): Promise<void> {
    // Add to queue for processing
    this.eventQueue.push(event);

    // Store event if storage is available
    if (this.storage) {
      try {
        await this.storage.store(event);
      } catch (error) {
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

  subscribe(filter: EventFilter, handler: (event: BrowserEvent) => void): EventSubscription {
    const subscription: EventSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filter,
      handler,
      active: true,
      createdAt: new Date()
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(subscriptionId);
    }
  }

  async getEvents(filter?: EventFilter): Promise<BrowserEvent[]> {
    if (this.storage) {
      return await this.storage.retrieve(filter);
    }
    return [];
  }

  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  registerProcessor(processor: EventProcessor): void {
    this.processors.push(processor);
  }

  unregisterProcessor(processor: EventProcessor): void {
    const index = this.processors.indexOf(processor);
    if (index > -1) {
      this.processors.splice(index, 1);
    }
  }

  private async processEvent(event: BrowserEvent): Promise<void> {
    // Find matching subscriptions
    const matchingSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.active && this.matchesFilter(event, sub.filter));

    // Call handlers
    for (const subscription of matchingSubscriptions) {
      try {
        subscription.handler(event);
      } catch (error) {
        console.error(`Event handler error for subscription ${subscription.id}:`, error);
      }
    }

    // Process through registered processors
    for (const processor of this.processors) {
      if (processor.canProcess(event)) {
        try {
          await processor.process(event);
        } catch (error) {
          console.error('Event processor error:', error);
        }
      }
    }
  }

  private matchesFilter(event: BrowserEvent, filter: EventFilter): boolean {
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

  private startEventProcessing(): void {
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

  destroy(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }
    this.subscriptions.clear();
    this.processors.length = 0;
    this.eventQueue.length = 0;
  }
}

// Event Processors for specific event types
export class TabEventProcessor implements EventProcessor {
  private tabState: Map<string, Tab> = new Map();

  canProcess(event: BrowserEvent): boolean {
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

  async process(event: BrowserEvent): Promise<void> {
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
          loadingTab.status = TabStatus.Loading;
        }
        break;
      case BrowserEventType.TAB_LOADED:
        const loadedTab = this.tabState.get(event.data.tabId);
        if (loadedTab) {
          loadedTab.status = TabStatus.Complete;
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

  getTabState(tabId: string): Tab | undefined {
    return this.tabState.get(tabId);
  }

  getAllTabs(): Tab[] {
    return Array.from(this.tabState.values());
  }
}

export class ProcessEventProcessor implements EventProcessor {
  private processState: Map<string, ProcessInfo> = new Map();

  canProcess(event: BrowserEvent): boolean {
    return [
      BrowserEventType.PROCESS_CREATED,
      BrowserEventType.PROCESS_DESTROYED,
      BrowserEventType.PROCESS_HEALTH_CHANGED,
      BrowserEventType.PROCESS_RESOURCE_ALLOCATION
    ].includes(event.type);
  }

  async process(event: BrowserEvent): Promise<void> {
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

  getProcessState(processId: string): ProcessInfo | undefined {
    return this.processState.get(processId);
  }

  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processState.values());
  }

  getProcessesByHealth(health: ProcessHealth): ProcessInfo[] {
    return Array.from(this.processState.values()).filter(p => p.health === health);
  }
}

export class AIEventProcessor implements EventProcessor {
  private aiContexts: Map<string, any> = new Map();

  canProcess(event: BrowserEvent): boolean {
    return [
      BrowserEventType.AI_CONTENT_READY,
      BrowserEventType.AI_CONTEXT_UPDATED,
      BrowserEventType.AI_ACTION_REQUESTED,
      BrowserEventType.AI_ACTION_COMPLETED,
      BrowserEventType.AI_PERMISSION_REQUESTED
    ].includes(event.type);
  }

  async process(event: BrowserEvent): Promise<void> {
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

  getAIContext(tabId: string): any {
    return this.aiContexts.get(tabId);
  }

  getAllAIContexts(): Map<string, any> {
    return new Map(this.aiContexts);
  }
}

// Factory functions
export function createEventBus(storage?: EventStorage): EventBus {
  return new AuraEventBus(storage);
}

export function createTabEventProcessor(): TabEventProcessor {
  return new TabEventProcessor();
}

export function createProcessEventProcessor(): ProcessEventProcessor {
  return new ProcessEventProcessor();
}

export function createAIEventProcessor(): AIEventProcessor {
  return new AIEventProcessor();
}
