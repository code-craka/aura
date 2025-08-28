// Advanced Tab Manager for Aura Browser
// Provides comprehensive tab lifecycle management, organization, and optimization

import { EventEmitter } from 'events';
import { Tab, TabStatus, TabOptions } from './chromium-engine';
import { ProcessManager, ProcessInfo, ProcessType, SecurityLevel } from './process-manager';

export interface TabMetadata {
  favicon?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  publishedDate?: Date;
  modifiedDate?: Date;
  contentType?: string;
  language?: string;
  readingTime?: number; // estimated minutes
  wordCount?: number;
  aiSummary?: string;
  aiTopics?: string[];
  aiSentiment?: 'positive' | 'negative' | 'neutral';
  lastContentUpdate?: Date;
  securityRating?: 'safe' | 'warning' | 'danger';
  privacyScore?: number; // 0-100
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  tabs: string[]; // Tab IDs
  collapsed: boolean;
  createdAt: Date;
  lastActive: Date;
  metadata: {
    description?: string;
    icon?: string;
    autoCollapse?: boolean;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  groups: string[]; // TabGroup IDs
  activeTabId?: string;
  settings: SpaceSettings;
  createdAt: Date;
  lastActive: Date;
  metadata: {
    color?: string;
    icon?: string;
    isDefault?: boolean;
    autoSwitchOnTabCreate?: boolean;
    memoryLimit?: number;
    tabLimit?: number;
  };
}

export interface SpaceSettings {
  theme?: string;
  layout?: 'grid' | 'list' | 'compact';
  autoSuspend?: boolean;
  memoryLimit?: number;
  aiEnabled?: boolean;
  backgroundImage?: string;
  customCSS?: string;
  shortcuts?: Record<string, string>; // keyboard shortcuts
}

export interface TabManager {
  createTab(url: string, options?: TabOptions): Promise<Tab>;
  destroyTab(tabId: string): Promise<void>;
  moveTab(tabId: string, targetGroupId: string): Promise<void>;
  suspendTab(tabId: string): Promise<void>;
  restoreTab(tabId: string): Promise<void>;
  getTab(tabId: string): Promise<Tab>;
  listTabs(): Promise<Tab[]>;
  searchTabs(query: string): Promise<Tab[]>;
  createGroup(name: string, color?: string): Promise<TabGroup>;
  destroyGroup(groupId: string): Promise<void>;
  createSpace(name: string, settings?: Partial<SpaceSettings>): Promise<Space>;
  destroySpace(spaceId: string): Promise<void>;
  switchSpace(spaceId: string): Promise<void>;
  optimizeMemory(): Promise<void>;
  // Enhanced Task 3 features
  updateTabMetadata(tabId: string, metadata: Partial<TabMetadata>): Promise<void>;
  searchTabsAdvanced(query: TabSearchQuery): Promise<Tab[]>;
  migrateTabsToSpace(tabIds: string[], targetSpaceId: string): Promise<void>;
  duplicateTab(tabId: string, targetGroupId?: string): Promise<Tab>;
  pinTab(tabId: string): Promise<void>;
  unpinTab(tabId: string): Promise<void>;
  bookmarkTab(tabId: string, folder?: string): Promise<void>;
  getTabHistory(tabId: string): Promise<TabHistoryEntry[]>;
  exportSpace(spaceId: string): Promise<SpaceExport>;
  importSpace(exportData: SpaceExport): Promise<Space>;
}

export interface TabSearchQuery {
  text?: string;
  url?: string;
  title?: string;
  groupId?: string;
  spaceId?: string;
  status?: TabStatus;
  suspended?: boolean;
  aiTopics?: string[];
  aiSentiment?: 'positive' | 'negative' | 'neutral';
  securityRating?: 'safe' | 'warning' | 'danger';
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'title' | 'url' | 'lastActive' | 'created' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TabHistoryEntry {
  url: string;
  title: string;
  timestamp: Date;
  transitionType: 'typed' | 'auto_bookmark' | 'auto_subframe' | 'manual_subframe' | 'generated' | 'auto_toplevel' | 'form_submit' | 'reload' | 'keyword' | 'keyword_generated';
  aiContext?: string;
}

export interface SpaceExport {
  space: Space;
  groups: TabGroup[];
  tabs: (Tab & { metadata: TabMetadata; history: TabHistoryEntry[] })[];
  version: string;
  exportedAt: Date;
}

export interface TabSuspensionStrategy {
  type: 'lru' | 'usage-based' | 'time-based' | 'memory-based' | 'hybrid';
  threshold: number;
  gracePeriod: number; // minutes
  usageWeight?: number; // for hybrid strategy
  memoryWeight?: number; // for hybrid strategy
  timeWeight?: number; // for hybrid strategy
}

export interface TabManagerConfig {
  maxTabs: number;
  defaultSpaceId: string;
  suspensionStrategy: TabSuspensionStrategy;
  memoryThreshold: number; // MB
  autoSaveState: boolean;
  enableAdvancedSearch: boolean;
  enableTabHistory: boolean;
  maxHistoryEntries: number;
  enableAIFeatures: boolean;
}

// Enhanced Tab Manager Implementation
export class AuraTabManager extends EventEmitter implements TabManager {
  private tabs: Map<string, Tab> = new Map();
  private groups: Map<string, TabGroup> = new Map();
  private spaces: Map<string, Space> = new Map();
  private activeSpaceId: string;
  private processManager: ProcessManager;
  private config: TabManagerConfig;
  private suspensionTimer: ReturnType<typeof setInterval> | null = null;
  private tabMetadata: Map<string, TabMetadata> = new Map();
  private tabHistory: Map<string, TabHistoryEntry[]> = new Map();
  private pinnedTabs: Set<string> = new Set();
  private bookmarkedTabs: Map<string, string> = new Map(); // tabId -> folder

  constructor(processManager: ProcessManager, config: TabManagerConfig) {
    super();
    this.processManager = processManager;
    this.config = config;
    this.activeSpaceId = config.defaultSpaceId;
    this.startSuspensionMonitoring();
    this.loadPersistedState();
  }

  async createTab(url: string, options: TabOptions = {}): Promise<Tab> {
    // Assign tab to appropriate space and group
    const spaceId = options.spaceId || this.activeSpaceId;
    const groupId = options.groupId;

    // Create renderer process for this tab
    const processInfo = await this.processManager.createProcess(ProcessType.Renderer, {
      memoryLimit: 100 * 1024 * 1024, // 100MB default
      securityLevel: SecurityLevel.Standard,
      aiEnabled: options.aiEnabled
    });

    const tab: Tab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      title: 'Loading...',
      status: TabStatus.Loading,
      groupId,
      spaceId,
      suspended: false,
      lastActive: new Date(),
      memoryUsage: 0,
      createdAt: new Date()
    };

    // Store tab info
    this.tabs.set(tab.id, tab);

    // Add to group if specified
    if (groupId) {
      const group = this.groups.get(groupId);
      if (group) {
        group.tabs.push(tab.id);
        group.lastActive = new Date();
      }
    }

    // Update space
    const space = this.spaces.get(spaceId);
    if (space && !space.activeTabId) {
      space.activeTabId = tab.id;
    }

    this.emit('tab-created', tab);
    return tab;
  }

  async destroyTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }

    // Remove from group
    if (tab.groupId) {
      const group = this.groups.get(tab.groupId);
      if (group) {
        group.tabs = group.tabs.filter(id => id !== tabId);
      }
    }

    // Remove from space
    const space = this.spaces.get(tab.spaceId);
    if (space && space.activeTabId === tabId) {
      space.activeTabId = space.groups.length > 0 ? undefined : undefined;
    }

    // Destroy associated process
    const processes = await this.processManager.listProcesses();
    const tabProcess = processes.find(p => p.tabs.includes(tabId));
    if (tabProcess) {
      await this.processManager.destroyProcess(tabProcess.id);
    }

    // Remove tab
    this.tabs.delete(tabId);

    this.emit('tab-destroyed', tab);
  }

  async moveTab(tabId: string, targetGroupId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }

    const targetGroup = this.groups.get(targetGroupId);
    if (!targetGroup) {
      throw new Error(`Group ${targetGroupId} not found`);
    }

    // Remove from old group
    if (tab.groupId) {
      const oldGroup = this.groups.get(tab.groupId);
      if (oldGroup) {
        oldGroup.tabs = oldGroup.tabs.filter(id => id !== tabId);
      }
    }

    // Add to new group
    targetGroup.tabs.push(tabId);
    targetGroup.lastActive = new Date();

    // Update tab
    tab.groupId = targetGroupId;
    this.tabs.set(tabId, tab);

    this.emit('tab-moved', { tab, fromGroupId: tab.groupId, toGroupId: targetGroupId });
  }

  async suspendTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }

    if (tab.suspended) {
      return; // Already suspended
    }

    try {
      // Serialize tab state
      const tabState = await this.serializeTabState(tab);

      // Mark as suspended
      tab.suspended = true;
      tab.status = TabStatus.Suspended;
      this.tabs.set(tabId, tab);

      // Suspend associated process
      const processes = await this.processManager.listProcesses();
      const tabProcess = processes.find(p => p.tabs.includes(tabId));
      if (tabProcess) {
        await this.processManager.allocateResources({
          processId: tabProcess.id,
          memoryLimit: 10 * 1024 * 1024, // Minimal memory
          cpuQuota: 5, // Minimal CPU
          networkPriority: 1
        });
      }

      // Save state to disk
      await this.saveTabState(tabId, tabState);

      this.emit('tab-suspended', tab);
    } catch (error) {
      throw new Error(`Failed to suspend tab ${tabId}: ${error}`);
    }
  }

  async restoreTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }

    if (!tab.suspended) {
      return; // Not suspended
    }

    try {
      // Load tab state
      const tabState = await this.loadTabState(tabId);

      // Restore process resources
      const processes = await this.processManager.listProcesses();
      const tabProcess = processes.find(p => p.tabs.includes(tabId));
      if (tabProcess) {
        await this.processManager.allocateResources({
          processId: tabProcess.id,
          memoryLimit: 100 * 1024 * 1024, // Normal memory
          cpuQuota: 50, // Normal CPU
          networkPriority: 5
        });
      }

      // Mark as restored
      tab.suspended = false;
      tab.status = TabStatus.Complete;
      tab.lastActive = new Date();
      this.tabs.set(tabId, tab);

      // Restore state
      await this.restoreTabState(tab, tabState);

      this.emit('tab-restored', tab);
    } catch (error) {
      throw new Error(`Failed to restore tab ${tabId}: ${error}`);
    }
  }

  async getTab(tabId: string): Promise<Tab> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }
    return tab;
  }

  async listTabs(): Promise<Tab[]> {
    return Array.from(this.tabs.values());
  }

  async searchTabs(query: string): Promise<Tab[]> {
    return this.searchTabsAdvanced({ text: query });
  }

  async createGroup(name: string, color: string = '#3B82F6'): Promise<TabGroup> {
    const group: TabGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
      tabs: [],
      collapsed: false,
      createdAt: new Date(),
      lastActive: new Date(),
      metadata: {
        description: undefined,
        icon: undefined,
        autoCollapse: false,
        priority: 'normal'
      }
    };

    this.groups.set(group.id, group);

    // Add to current space
    const space = this.spaces.get(this.activeSpaceId);
    if (space) {
      space.groups.push(group.id);
    }

    this.emit('group-created', group);
    return group;
  }

  async destroyGroup(groupId: string): Promise<void> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    // Move all tabs to ungrouped or destroy them
    for (const tabId of group.tabs) {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.groupId = undefined;
        this.tabs.set(tabId, tab);
      }
    }

    // Remove from space
    const space = this.spaces.get(this.activeSpaceId);
    if (space) {
      space.groups = space.groups.filter(id => id !== groupId);
    }

    this.groups.delete(groupId);
    this.emit('group-destroyed', group);
  }

  async createSpace(name: string, settings: Partial<SpaceSettings> = {}): Promise<Space> {
    const space: Space = {
      id: `space_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      groups: [],
      settings: {
        theme: 'default',
        layout: 'grid',
        autoSuspend: true,
        memoryLimit: 500 * 1024 * 1024, // 500MB
        aiEnabled: true,
        ...settings
      },
      createdAt: new Date(),
      lastActive: new Date(),
      metadata: {
        color: undefined,
        icon: undefined,
        isDefault: false,
        autoSwitchOnTabCreate: false,
        memoryLimit: undefined,
        tabLimit: undefined
      }
    };

    this.spaces.set(space.id, space);
    this.emit('space-created', space);
    return space;
  }

  async destroySpace(spaceId: string): Promise<void> {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error(`Space ${spaceId} not found`);
    }

    // Destroy all groups in the space
    for (const groupId of space.groups) {
      await this.destroyGroup(groupId);
    }

    this.spaces.delete(spaceId);
    this.emit('space-destroyed', space);
  }

  async switchSpace(spaceId: string): Promise<void> {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error(`Space ${spaceId} not found`);
    }

    this.activeSpaceId = spaceId;
    space.lastActive = new Date();

    this.emit('space-switched', space);
  }

  async optimizeMemory(): Promise<void> {
    const tabs = Array.from(this.tabs.values());
    const processes = await this.processManager.listProcesses();

    // Calculate total memory usage
    let totalMemory = 0;
    for (const process of processes) {
      totalMemory += process.memoryUsage;
    }

    const memoryLimit = this.config.memoryThreshold * 1024 * 1024;
    const memoryUsagePercent = (totalMemory / memoryLimit) * 100;

    if (memoryUsagePercent < 80) {
      return; // Memory usage is acceptable
    }

    // Enhanced memory optimization strategy
    const optimizationStrategy = {
      suspendInactive: memoryUsagePercent > 85,
      reduceNonEssential: memoryUsagePercent > 90,
      aggressiveSuspension: memoryUsagePercent > 95
    };

    // Sort tabs by priority (pinned tabs have highest priority)
    const sortedTabs = tabs
      .filter(tab => !tab.suspended)
      .sort((a, b) => {
        // Pinned tabs first
        if (this.pinnedTabs.has(a.id) && !this.pinnedTabs.has(b.id)) return 1;
        if (!this.pinnedTabs.has(a.id) && this.pinnedTabs.has(b.id)) return -1;

        // Then by last activity
        return a.lastActive.getTime() - b.lastActive.getTime();
      });

    let suspendedCount = 0;
    let memoryFreed = 0;

    // Phase 1: Suspend inactive tabs
    if (optimizationStrategy.suspendInactive) {
      const inactiveTabs = sortedTabs.filter(tab => {
        const timeSinceActive = Date.now() - tab.lastActive.getTime();
        return timeSinceActive > 10 * 60 * 1000 && !this.pinnedTabs.has(tab.id); // 10 minutes
      });

      for (const tab of inactiveTabs) {
        if (totalMemory < memoryLimit * 0.9) break; // Stop if memory is below 90%

        try {
          await this.suspendTab(tab.id);
          suspendedCount++;
          memoryFreed += tab.memoryUsage;
          totalMemory -= tab.memoryUsage;
        } catch (error) {
          console.warn(`Failed to suspend tab ${tab.id}:`, error);
        }
      }
    }

    // Phase 2: Reduce memory for non-essential tabs
    if (optimizationStrategy.reduceNonEssential) {
      const nonEssentialTabs = sortedTabs.filter(tab => {
        const metadata = this.tabMetadata.get(tab.id);
        return !this.pinnedTabs.has(tab.id) &&
               (!metadata?.aiTopics || metadata.aiTopics.length === 0) &&
               !tab.suspended;
      });

      for (const tab of nonEssentialTabs) {
        if (totalMemory < memoryLimit * 0.85) break; // Stop if memory is below 85%

        try {
          // Reduce memory allocation for this tab
          const processes = await this.processManager.listProcesses();
          const tabProcess = processes.find(p => p.tabs.includes(tab.id));
          if (tabProcess) {
            await this.processManager.allocateResources({
              processId: tabProcess.id,
              memoryLimit: Math.max(tabProcess.memoryUsage * 0.7, 50 * 1024 * 1024), // 70% or minimum 50MB
              cpuQuota: Math.max(tabProcess.cpuUsage * 0.8, 10), // 80% or minimum 10%
              networkPriority: 3 // Lower priority for non-essential tabs
            });
          }
          memoryFreed += tab.memoryUsage * 0.3; // Estimate 30% reduction
        } catch (error) {
          console.warn(`Failed to reduce memory for tab ${tab.id}:`, error);
        }
      }
    }

    // Phase 3: Aggressive suspension (last resort)
    if (optimizationStrategy.aggressiveSuspension) {
      const remainingTabs = sortedTabs.filter(tab => !tab.suspended && !this.pinnedTabs.has(tab.id));

      for (const tab of remainingTabs) {
        if (totalMemory < memoryLimit * 0.8) break; // Stop if memory is below 80%

        try {
          await this.suspendTab(tab.id);
          suspendedCount++;
          memoryFreed += tab.memoryUsage;
          totalMemory -= tab.memoryUsage;
        } catch (error) {
          console.warn(`Failed to aggressively suspend tab ${tab.id}:`, error);
        }
      }
    }

    if (suspendedCount > 0 || memoryFreed > 0) {
      this.emit('memory-optimized', {
        suspendedCount,
        memoryFreed,
        totalMemory,
        memoryLimit,
        strategy: optimizationStrategy
      });
    }
  }

  private startSuspensionMonitoring(): void {
    this.suspensionTimer = setInterval(() => {
      this.checkSuspensionCriteria().catch(error => {
        console.error('Suspension monitoring error:', error);
      });
    }, 60000); // Check every minute
  }

  private async checkSuspensionCriteria(): Promise<void> {
    const now = Date.now();
    const gracePeriod = this.config.suspensionStrategy.gracePeriod * 60 * 1000;

    for (const [tabId, tab] of this.tabs) {
      if (tab.suspended || this.pinnedTabs.has(tabId)) continue;

      let shouldSuspend = false;
      let suspensionScore = 0;

      switch (this.config.suspensionStrategy.type) {
        case 'time-based':
          shouldSuspend = (now - tab.lastActive.getTime()) > gracePeriod;
          break;

        case 'usage-based':
          // Calculate usage score based on various factors
          const timeSinceActive = now - tab.lastActive.getTime();
          const metadata = this.tabMetadata.get(tabId);
          const hasRecentContent = metadata?.lastContentUpdate &&
            (now - metadata.lastContentUpdate.getTime()) < gracePeriod;

          suspensionScore = timeSinceActive / (1000 * 60); // minutes since active
          if (hasRecentContent) suspensionScore *= 0.5; // Reduce score if recent content
          shouldSuspend = suspensionScore > this.config.suspensionStrategy.threshold;
          break;

        case 'memory-based':
          shouldSuspend = tab.memoryUsage > this.config.suspensionStrategy.threshold * 1024 * 1024;
          break;

        case 'hybrid':
          // Combine multiple factors with weights
          const timeWeight = this.config.suspensionStrategy.timeWeight || 0.4;
          const memoryWeight = this.config.suspensionStrategy.memoryWeight || 0.4;
          const usageWeight = this.config.suspensionStrategy.usageWeight || 0.2;

          const timeScore = Math.min((now - tab.lastActive.getTime()) / gracePeriod, 1);
          const memoryScore = Math.min(tab.memoryUsage / (this.config.suspensionStrategy.threshold * 1024 * 1024), 1);
          const usageScore = suspensionScore / 60; // Normalize usage score

          const hybridScore = (timeScore * timeWeight) + (memoryScore * memoryWeight) + (usageScore * usageWeight);
          shouldSuspend = hybridScore > 0.7; // Threshold for hybrid strategy
          break;

        case 'lru':
        default:
          // Least Recently Used - suspend oldest tabs first
          const sortedTabs = Array.from(this.tabs.values())
            .filter(t => !t.suspended && !this.pinnedTabs.has(t.id))
            .sort((a, b) => a.lastActive.getTime() - b.lastActive.getTime());

          const tabsToSuspend = Math.min(3, Math.floor(sortedTabs.length * 0.1)); // Suspend 10% or max 3
          const tabIndex = sortedTabs.findIndex(t => t.id === tabId);
          shouldSuspend = tabIndex >= 0 && tabIndex < tabsToSuspend;
          break;
      }

      if (shouldSuspend) {
        try {
          await this.suspendTab(tabId);
        } catch (error) {
          console.warn(`Auto-suspension failed for tab ${tabId}:`, error);
        }
      }
    }
  }

  private async serializeTabState(tab: Tab): Promise<any> {
    // This would serialize the tab's current state
    // Including scroll position, form data, etc.
    return {
      url: tab.url,
      title: tab.title,
      scrollPosition: { x: 0, y: 0 }, // Placeholder
      formData: {}, // Placeholder
      lastActive: tab.lastActive
    };
  }

  private async saveTabState(tabId: string, state: any): Promise<void> {
    // This would save the state to disk or database
    console.log(`Saving state for tab ${tabId}`);
  }

  private async loadTabState(tabId: string): Promise<any> {
    // This would load the state from disk or database
    return {
      url: '',
      title: '',
      scrollPosition: { x: 0, y: 0 },
      formData: {},
      lastActive: new Date()
    };
  }

  private async restoreTabState(tab: Tab, state: any): Promise<void> {
    // This would restore the tab's state
    console.log(`Restoring state for tab ${tab.id}`);
  }

  private async loadPersistedState(): Promise<void> {
    // This would load persisted tabs, groups, and spaces from storage
    // For now, create a default space
    if (this.spaces.size === 0) {
      await this.createSpace('Default', {
        theme: 'default',
        layout: 'grid',
        autoSuspend: true,
        aiEnabled: true
      });
    }
  }

  destroy(): void {
    if (this.suspensionTimer) {
      clearInterval(this.suspensionTimer);
    }
  }

  // Task 3.1: Enhanced Tab and TabGroup data models
  async updateTabMetadata(tabId: string, metadata: Partial<TabMetadata>): Promise<void> {
    const existingMetadata = this.tabMetadata.get(tabId) || {};
    const updatedMetadata = { ...existingMetadata, ...metadata };
    this.tabMetadata.set(tabId, updatedMetadata);

    const tab = this.tabs.get(tabId);
    if (tab) {
      this.emit('tab-metadata-updated', { tab, metadata: updatedMetadata });
    }
  }

  async searchTabsAdvanced(query: TabSearchQuery): Promise<Tab[]> {
    let allTabs = Array.from(this.tabs.values());

    // Apply filters
    if (query.text) {
      const lowercaseQuery = query.text.toLowerCase();
      allTabs = allTabs.filter(tab => {
        const metadata = this.tabMetadata.get(tab.id);
        return tab.title.toLowerCase().includes(lowercaseQuery) ||
               tab.url.toLowerCase().includes(lowercaseQuery) ||
               metadata?.aiSummary?.toLowerCase().includes(lowercaseQuery) ||
               metadata?.aiTopics?.some(topic => topic.toLowerCase().includes(lowercaseQuery));
      });
    }

    if (query.url) {
      allTabs = allTabs.filter(tab => tab.url.includes(query.url!));
    }

    if (query.title) {
      allTabs = allTabs.filter(tab => tab.title.includes(query.title!));
    }

    if (query.groupId) {
      allTabs = allTabs.filter(tab => tab.groupId === query.groupId);
    }

    if (query.spaceId) {
      allTabs = allTabs.filter(tab => tab.spaceId === query.spaceId);
    }

    if (query.status) {
      allTabs = allTabs.filter(tab => tab.status === query.status);
    }

    if (query.suspended !== undefined) {
      allTabs = allTabs.filter(tab => tab.suspended === query.suspended);
    }

    if (query.aiTopics && query.aiTopics.length > 0) {
      allTabs = allTabs.filter(tab => {
        const metadata = this.tabMetadata.get(tab.id);
        return metadata?.aiTopics?.some(topic => query.aiTopics!.includes(topic));
      });
    }

    if (query.aiSentiment) {
      allTabs = allTabs.filter(tab => {
        const metadata = this.tabMetadata.get(tab.id);
        return metadata?.aiSentiment === query.aiSentiment;
      });
    }

    if (query.securityRating) {
      allTabs = allTabs.filter(tab => {
        const metadata = this.tabMetadata.get(tab.id);
        return metadata?.securityRating === query.securityRating;
      });
    }

    if (query.dateRange) {
      allTabs = allTabs.filter(tab =>
        tab.createdAt >= query.dateRange!.start && tab.createdAt <= query.dateRange!.end
      );
    }

    // Apply sorting
    const sortBy = query.sortBy || 'lastActive';
    const sortOrder = query.sortOrder || 'desc';

    allTabs.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'url':
          aValue = a.url;
          bValue = b.url;
          break;
        case 'created':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'relevance':
          // Simple relevance scoring based on recency and activity
          aValue = a.lastActive.getTime() + (this.pinnedTabs.has(a.id) ? 1000000 : 0);
          bValue = b.lastActive.getTime() + (this.pinnedTabs.has(b.id) ? 1000000 : 0);
          break;
        default: // lastActive
          aValue = a.lastActive;
          bValue = b.lastActive;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || allTabs.length;
    return allTabs.slice(offset, offset + limit);
  }

  // Task 3.2: Advanced Spaces system
  async migrateTabsToSpace(tabIds: string[], targetSpaceId: string): Promise<void> {
    const targetSpace = this.spaces.get(targetSpaceId);
    if (!targetSpace) {
      throw new Error(`Space ${targetSpaceId} not found`);
    }

    const migratedTabs: Tab[] = [];

    for (const tabId of tabIds) {
      const tab = this.tabs.get(tabId);
      if (!tab) {
        console.warn(`Tab ${tabId} not found, skipping migration`);
        continue;
      }

      // Remove from old space
      const oldSpace = this.spaces.get(tab.spaceId);
      if (oldSpace && oldSpace.activeTabId === tabId) {
        oldSpace.activeTabId = undefined;
      }

      // Update tab's space
      tab.spaceId = targetSpaceId;
      this.tabs.set(tabId, tab);
      migratedTabs.push(tab);

      // If tab has a group, move the group too
      if (tab.groupId) {
        const group = this.groups.get(tab.groupId);
        if (group) {
          // Remove from old space
          const oldSpace = this.spaces.get(tab.spaceId);
          if (oldSpace) {
            oldSpace.groups = oldSpace.groups.filter(id => id !== tab.groupId);
          }
          // Add to new space
          targetSpace.groups.push(tab.groupId);
        }
      }
    }

    this.emit('tabs-migrated', { tabIds, targetSpaceId, migratedTabs });
  }

  async duplicateTab(tabId: string, targetGroupId?: string): Promise<Tab> {
    const originalTab = this.tabs.get(tabId);
    if (!originalTab) {
      throw new Error(`Tab ${tabId} not found`);
    }

    // Create duplicate tab
    const duplicatedTab = await this.createTab(originalTab.url, {
      spaceId: originalTab.spaceId,
      groupId: targetGroupId || originalTab.groupId,
      aiEnabled: originalTab.aiContext !== undefined
    });

    // Copy metadata if available
    const metadata = this.tabMetadata.get(tabId);
    if (metadata) {
      this.tabMetadata.set(duplicatedTab.id, { ...metadata });
    }

    // Copy history if available
    const history = this.tabHistory.get(tabId);
    if (history) {
      this.tabHistory.set(duplicatedTab.id, [...history]);
    }

    this.emit('tab-duplicated', { originalTab, duplicatedTab });
    return duplicatedTab;
  }

  // Task 3.3: Enhanced tab management features
  async pinTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }

    if (this.pinnedTabs.has(tabId)) {
      return; // Already pinned
    }

    this.pinnedTabs.add(tabId);
    this.emit('tab-pinned', tab);
  }

  async unpinTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }

    if (!this.pinnedTabs.has(tabId)) {
      return; // Not pinned
    }

    this.pinnedTabs.delete(tabId);
    this.emit('tab-unpinned', tab);
  }

  async bookmarkTab(tabId: string, folder?: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }

    this.bookmarkedTabs.set(tabId, folder || 'default');
    this.emit('tab-bookmarked', { tab, folder: folder || 'default' });
  }

  async getTabHistory(tabId: string): Promise<TabHistoryEntry[]> {
    return this.tabHistory.get(tabId) || [];
  }

  async exportSpace(spaceId: string): Promise<SpaceExport> {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error(`Space ${spaceId} not found`);
    }

    const groups: TabGroup[] = [];
    const tabs: (Tab & { metadata: TabMetadata; history: TabHistoryEntry[] })[] = [];

    // Collect groups
    for (const groupId of space.groups) {
      const group = this.groups.get(groupId);
      if (group) {
        groups.push(group);
      }
    }

    // Collect tabs from all groups in the space
    for (const group of groups) {
      for (const tabId of group.tabs) {
        const tab = this.tabs.get(tabId);
        if (tab) {
          const metadata = this.tabMetadata.get(tabId) || {};
          const history = this.tabHistory.get(tabId) || [];
          tabs.push({ ...tab, metadata, history });
        }
      }
    }

    return {
      space,
      groups,
      tabs,
      version: '1.0',
      exportedAt: new Date()
    };
  }

  async importSpace(exportData: SpaceExport): Promise<Space> {
    // Create new space
    const space = await this.createSpace(
      `${exportData.space.name} (Imported)`,
      exportData.space.settings
    );

    // Create groups
    const groupIdMap = new Map<string, string>();
    for (const group of exportData.groups) {
      const newGroup = await this.createGroup(group.name, group.color);
      groupIdMap.set(group.id, newGroup.id);
    }

    // Create tabs
    for (const tabData of exportData.tabs) {
      const groupId = tabData.groupId ? groupIdMap.get(tabData.groupId) : undefined;
      const newTab = await this.createTab(tabData.url, {
        spaceId: space.id,
        groupId,
        aiEnabled: tabData.aiContext !== undefined
      });

      // Restore metadata and history
      this.tabMetadata.set(newTab.id, tabData.metadata);
      this.tabHistory.set(newTab.id, tabData.history);
    }

    this.emit('space-imported', { originalSpace: exportData.space, newSpace: space });
    return space;
  }
}

// Factory function
export function createTabManager(processManager: ProcessManager, config: TabManagerConfig): TabManager {
  return new AuraTabManager(processManager, config);
}
