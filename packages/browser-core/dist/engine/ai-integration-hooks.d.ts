import { EventEmitter } from 'events';
export interface AIIntegrationHooks {
    extractPageContent(tabId: string, options: ExtractionOptions): Promise<SafeContent>;
    performBrowserAction(action: BrowserAction): Promise<ActionResult>;
    subscribeToEvents(events: BrowserEvent[], handler: EventHandler): Subscription;
    requestUserPermission(permission: AIPermission): Promise<boolean>;
    getCrossTabContext(options: ContextOptions): Promise<CrossTabContext>;
}
export interface SafeContent {
    content: string;
    metadata: ContentMetadata;
    privacyLevel: PrivacyLevel;
    sources: ContentSource[];
    aiReady: boolean;
}
export interface ContentMetadata {
    title: string;
    description?: string;
    keywords?: string[];
    author?: string;
    contentType: string;
    language?: string;
    readingTime?: number;
    wordCount: number;
}
export interface ContentSource {
    tabId: string;
    url: string;
    title: string;
    extractedAt: Date;
    relevanceScore: number;
}
export declare enum PrivacyLevel {
    Public = "public",
    Internal = "internal",
    Confidential = "confidential",
    Restricted = "restricted"
}
export interface BrowserAction {
    type: ActionType;
    target: ActionTarget;
    parameters: ActionParameters;
    requiresConfirmation: boolean;
    aiGenerated?: boolean;
}
export declare enum ActionType {
    Navigate = "navigate",
    Click = "click",
    Type = "type",
    Scroll = "scroll",
    Extract = "extract",
    Screenshot = "screenshot"
}
export interface ActionTarget {
    type: 'element' | 'coordinate' | 'url';
    selector?: string;
    x?: number;
    y?: number;
    url?: string;
}
export interface ActionParameters {
    text?: string;
    delay?: number;
    options?: Record<string, any>;
}
export interface ActionResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}
export interface BrowserEvent {
    type: string;
    tabId: string;
    timestamp: Date;
    data?: any;
}
export type EventHandler = (event: BrowserEvent) => void;
export interface Subscription {
    unsubscribe(): void;
    id: string;
}
export interface AIPermission {
    type: string;
    description: string;
    scope: PermissionScope;
}
export declare enum PermissionScope {
    Tab = "tab",
    Window = "window",
    Browser = "browser"
}
export interface ContextOptions {
    includeAllTabs?: boolean;
    tabIds?: string[];
    maxTabs?: number;
    includePrivate?: boolean;
    contextTypes?: string[];
}
export interface CrossTabContext {
    tabs: TabContext[];
    summary: string;
    topics: string[];
    relationships: TabRelationship[];
}
export interface TabContext {
    tabId: string;
    url: string;
    title: string;
    content: string;
    metadata: ContentMetadata;
    lastActive: Date;
}
export interface TabRelationship {
    fromTabId: string;
    toTabId: string;
    type: 'related' | 'parent' | 'child' | 'duplicate';
    strength: number;
}
export interface ExtractionOptions {
    includeText?: boolean;
    includeHTML?: boolean;
    includeMetadata?: boolean;
    respectPrivacy?: boolean;
    maxContentLength?: number;
    sanitizeContent?: boolean;
}
export declare class AuraAIIntegrationHooks extends EventEmitter implements AIIntegrationHooks {
    private subscriptions;
    private permissions;
    extractPageContent(tabId: string, options: ExtractionOptions): Promise<SafeContent>;
    performBrowserAction(action: BrowserAction): Promise<ActionResult>;
    subscribeToEvents(events: BrowserEvent[], handler: EventHandler): Subscription;
    requestUserPermission(permission: AIPermission): Promise<boolean>;
    getCrossTabContext(options: ContextOptions): Promise<CrossTabContext>;
    private extractNativeContent;
    private filterContent;
    private generateAIMetadata;
    private determinePrivacyLevel;
    private executeBrowserAction;
    private requestUserConfirmation;
    private requestPermissionFromUser;
    private getRelevantTabs;
    private analyzeCrossTabRelationships;
    private navigateToUrl;
    private clickElement;
    private typeText;
}
export declare function createAIIntegrationHooks(): AIIntegrationHooks;
//# sourceMappingURL=ai-integration-hooks.d.ts.map