import { EventEmitter } from 'events';
import { Tab, TabStatus, TabOptions } from './chromium-engine';
import { ProcessManager } from './process-manager';
export interface TabMetadata {
    favicon?: string;
    description?: string;
    keywords?: string[];
    author?: string;
    publishedDate?: Date;
    modifiedDate?: Date;
    contentType?: string;
    language?: string;
    readingTime?: number;
    wordCount?: number;
    aiSummary?: string;
    aiTopics?: string[];
    aiSentiment?: 'positive' | 'negative' | 'neutral';
    lastContentUpdate?: Date;
    securityRating?: 'safe' | 'warning' | 'danger';
    privacyScore?: number;
}
export interface TabGroup {
    id: string;
    name: string;
    color: string;
    tabs: string[];
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
    groups: string[];
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
    shortcuts?: Record<string, string>;
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
    tabs: (Tab & {
        metadata: TabMetadata;
        history: TabHistoryEntry[];
    })[];
    version: string;
    exportedAt: Date;
}
export interface TabSuspensionStrategy {
    type: 'lru' | 'usage-based' | 'time-based' | 'memory-based' | 'hybrid';
    threshold: number;
    gracePeriod: number;
    usageWeight?: number;
    memoryWeight?: number;
    timeWeight?: number;
}
export interface TabManagerConfig {
    maxTabs: number;
    defaultSpaceId: string;
    suspensionStrategy: TabSuspensionStrategy;
    memoryThreshold: number;
    autoSaveState: boolean;
    enableAdvancedSearch: boolean;
    enableTabHistory: boolean;
    maxHistoryEntries: number;
    enableAIFeatures: boolean;
}
export declare class AuraTabManager extends EventEmitter implements TabManager {
    private tabs;
    private groups;
    private spaces;
    private activeSpaceId;
    private processManager;
    private config;
    private suspensionTimer;
    private tabMetadata;
    private tabHistory;
    private pinnedTabs;
    private bookmarkedTabs;
    constructor(processManager: ProcessManager, config: TabManagerConfig);
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
    private startSuspensionMonitoring;
    private checkSuspensionCriteria;
    private serializeTabState;
    private saveTabState;
    private loadTabState;
    private restoreTabState;
    private loadPersistedState;
    destroy(): void;
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
export declare function createTabManager(processManager: ProcessManager, config: TabManagerConfig): TabManager;
//# sourceMappingURL=tab-manager.d.ts.map