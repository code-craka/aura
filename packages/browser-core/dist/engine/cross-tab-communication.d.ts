import { EventEmitter } from 'events';
import { Tab } from './chromium-engine';
import { IPCManager } from './process-manager';
import { TabManager } from './tab-manager';
export interface CrossTabMessage {
    id: string;
    fromTabId: string;
    toTabId?: string;
    type: MessageType;
    payload: any;
    timestamp: Date;
    priority: MessagePriority;
    requiresResponse?: boolean;
    correlationId?: string;
    ttl?: number;
    metadata?: {
        userId?: string;
        sessionId?: string;
        permissions?: string[];
        aiContext?: any;
    };
}
export declare enum MessageType {
    SHARED_DATA_UPDATE = "shared_data_update",
    SHARED_DATA_REQUEST = "shared_data_request",
    SHARED_DATA_RESPONSE = "shared_data_response",
    COLLABORATION_JOIN = "collaboration_join",
    COLLABORATION_LEAVE = "collaboration_leave",
    COLLABORATION_UPDATE = "collaboration_update",
    COLLABORATION_CURSOR = "collaboration_cursor",
    COLLABORATION_SELECTION = "collaboration_selection",
    AI_CONTEXT_SHARE = "ai_context_share",
    AI_SUGGESTION = "ai_suggestion",
    AI_ANALYSIS_REQUEST = "ai_analysis_request",
    AI_ANALYSIS_RESPONSE = "ai_analysis_response",
    TAB_STATE_CHANGE = "tab_state_change",
    TAB_FOCUS_CHANGE = "tab_focus_change",
    TAB_CONTENT_UPDATE = "tab_content_update",
    CUSTOM = "custom"
}
export declare enum MessagePriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export interface SharedDataContext {
    id: string;
    name: string;
    description?: string;
    ownerTabId: string;
    participants: string[];
    data: Map<string, any>;
    schema?: DataSchema;
    permissions: DataPermissions;
    createdAt: Date;
    lastModified: Date;
    version: number;
    aiEnhanced?: boolean;
}
export interface DataSchema {
    type: 'object' | 'array' | 'primitive';
    properties?: Record<string, SchemaProperty>;
    items?: SchemaProperty;
    required?: string[];
    aiDescription?: string;
}
export interface SchemaProperty {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    aiContext?: string;
    validation?: any;
}
export interface DataPermissions {
    read: string[];
    write: string[];
    admin: string[];
    public: boolean;
}
export interface CollaborationSession {
    id: string;
    name: string;
    description?: string;
    type: CollaborationType;
    participants: CollaborationParticipant[];
    sharedContexts: string[];
    settings: CollaborationSettings;
    createdAt: Date;
    lastActivity: Date;
    status: 'active' | 'paused' | 'ended';
}
export declare enum CollaborationType {
    DOCUMENT_EDITING = "document_editing",
    RESEARCH_SESSION = "research_session",
    AI_ASSISTED_WORKFLOW = "ai_assisted_workflow",
    CUSTOM = "custom"
}
export interface CollaborationParticipant {
    tabId: string;
    userId?: string;
    role: 'owner' | 'editor' | 'viewer' | 'observer';
    joinedAt: Date;
    lastActivity: Date;
    cursor?: CursorPosition;
    selection?: TextSelection;
    permissions: string[];
}
export interface CursorPosition {
    line: number;
    column: number;
    offset?: number;
}
export interface TextSelection {
    start: CursorPosition;
    end: CursorPosition;
    text?: string;
}
export interface CollaborationSettings {
    realTimeUpdates: boolean;
    conflictResolution: 'manual' | 'automatic' | 'owner_priority';
    aiAssistance: boolean;
    recordingEnabled: boolean;
    maxParticipants: number;
    idleTimeout: number;
}
export interface CrossTabCommunication {
    sendMessage(message: CrossTabMessage): Promise<void>;
    broadcastMessage(message: Omit<CrossTabMessage, 'toTabId'>): Promise<void>;
    subscribeToMessages(handler: (message: CrossTabMessage) => void): Subscription;
    subscribeToTab(tabId: string, handler: (message: CrossTabMessage) => void): Subscription;
    createSharedContext(name: string, initialData?: any, permissions?: Partial<DataPermissions>): Promise<SharedDataContext>;
    joinSharedContext(contextId: string): Promise<SharedDataContext>;
    leaveSharedContext(contextId: string): Promise<void>;
    updateSharedData(contextId: string, key: string, value: any): Promise<void>;
    getSharedData(contextId: string, key?: string): Promise<any>;
    listSharedContexts(): Promise<SharedDataContext[]>;
    createCollaborationSession(name: string, type: CollaborationType, settings?: Partial<CollaborationSettings>): Promise<CollaborationSession>;
    joinCollaborationSession(sessionId: string): Promise<CollaborationSession>;
    leaveCollaborationSession(sessionId: string): Promise<void>;
    updateCollaborationState(sessionId: string, updates: Partial<CollaborationParticipant>): Promise<void>;
    listCollaborationSessions(): Promise<CollaborationSession[]>;
    requestPermission(fromTabId: string, toTabId: string, permission: string): Promise<boolean>;
    grantPermission(fromTabId: string, toTabId: string, permission: string): Promise<void>;
    revokePermission(fromTabId: string, toTabId: string, permission: string): Promise<void>;
    checkPermission(fromTabId: string, toTabId: string, permission: string): Promise<boolean>;
    resolveConflict(contextId: string, key: string, conflictingValues: any[]): Promise<any>;
    getConflictHistory(contextId: string): Promise<ConflictRecord[]>;
    getConnectedTabs(): Promise<Tab[]>;
    getTabConnections(tabId: string): Promise<TabConnection[]>;
    cleanup(): Promise<void>;
}
export interface Subscription {
    unsubscribe(): void;
    id: string;
}
export interface TabConnection {
    tabId: string;
    connectedAt: Date;
    lastMessageAt?: Date;
    messageCount: number;
    permissions: string[];
    status: 'connected' | 'disconnected' | 'error';
}
export interface ConflictRecord {
    id: string;
    contextId: string;
    key: string;
    conflictingValues: Array<{
        value: any;
        tabId: string;
        timestamp: Date;
    }>;
    resolvedValue?: any;
    resolvedBy?: string;
    resolvedAt?: Date;
    resolutionMethod: 'manual' | 'automatic' | 'owner_priority';
}
export declare class AuraCrossTabCommunication extends EventEmitter implements CrossTabCommunication {
    private ipcManager;
    private tabManager;
    private sharedContexts;
    private collaborationSessions;
    private messageHandlers;
    private tabConnections;
    private permissions;
    private conflicts;
    private subscriptions;
    constructor(ipcManager: IPCManager, tabManager: TabManager);
    sendMessage(message: CrossTabMessage): Promise<void>;
    broadcastMessage(message: Omit<CrossTabMessage, 'toTabId'>): Promise<void>;
    subscribeToMessages(handler: (message: CrossTabMessage) => void): Subscription;
    subscribeToTab(tabId: string, handler: (message: CrossTabMessage) => void): Subscription;
    createSharedContext(name: string, initialData?: any, permissions?: Partial<DataPermissions>): Promise<SharedDataContext>;
    joinSharedContext(contextId: string): Promise<SharedDataContext>;
    leaveSharedContext(contextId: string): Promise<void>;
    updateSharedData(contextId: string, key: string, value: any): Promise<void>;
    getSharedData(contextId: string, key?: string): Promise<any>;
    listSharedContexts(): Promise<SharedDataContext[]>;
    createCollaborationSession(name: string, type: CollaborationType, settings?: Partial<CollaborationSettings>): Promise<CollaborationSession>;
    joinCollaborationSession(sessionId: string): Promise<CollaborationSession>;
    leaveCollaborationSession(sessionId: string): Promise<void>;
    updateCollaborationState(sessionId: string, updates: Partial<CollaborationParticipant>): Promise<void>;
    listCollaborationSessions(): Promise<CollaborationSession[]>;
    requestPermission(fromTabId: string, toTabId: string, permission: string): Promise<boolean>;
    grantPermission(fromTabId: string, toTabId: string, permission: string): Promise<void>;
    revokePermission(fromTabId: string, toTabId: string, permission: string): Promise<void>;
    checkPermission(fromTabId: string, toTabId: string, permission: string): Promise<boolean>;
    resolveConflict(contextId: string, key: string, conflictingValues: any[]): Promise<any>;
    getConflictHistory(contextId: string): Promise<ConflictRecord[]>;
    getConnectedTabs(): Promise<Tab[]>;
    getTabConnections(tabId: string): Promise<TabConnection[]>;
    cleanup(): Promise<void>;
    private initializeSystem;
    private checkMessagePermission;
    private handleDataConflict;
    private broadcastToParticipants;
    private updateConnectionStats;
    private ensureChannel;
    private getCurrentTab;
}
export declare function createCrossTabCommunication(ipcManager: IPCManager, tabManager: TabManager): CrossTabCommunication;
//# sourceMappingURL=cross-tab-communication.d.ts.map