import { EventEmitter } from 'events';
import { AuraSecurityFramework } from './security/security-framework';
import { AuraProcessManager } from './process-manager';
/**
 * AIIntegrationManager - AI Integration APIs for Aura Browser
 *
 * Provides comprehensive AI integration capabilities including:
 * - Content extraction APIs with privacy protection
 * - Browser action automation with user confirmation
 * - AI event system and state monitoring
 * - Performance tracking and resource optimization
 */
export declare enum PrivacyLevel {
    Public = "public",
    Private = "private",
    Sensitive = "sensitive"
}
export declare enum ActionType {
    Click = "click",
    Type = "type",
    Scroll = "scroll",
    Navigate = "navigate",
    Wait = "wait",
    Screenshot = "screenshot"
}
export declare enum AIEventType {
    ContentChange = "content_change",
    UserAction = "user_action",
    Performance = "performance",
    Security = "security",
    Automation = "automation"
}
export declare enum EventPriority {
    Low = "low",
    Medium = "medium",
    High = "high",
    Critical = "critical"
}
export interface ContentExtractionOptions {
    includeText: boolean;
    includeImages: boolean;
    includeLinks: boolean;
    includeMetadata: boolean;
    maxContentLength: number;
    privacyLevel: PrivacyLevel;
    sanitizeContent: boolean;
}
export interface ExtractedContent {
    url: string;
    title: string;
    text: string;
    images: ImageData[];
    links: LinkData[];
    metadata: ContentMetadata;
    extractedAt: Date;
    privacyLevel: PrivacyLevel;
    checksum: string;
}
export interface ImageData {
    src: string;
    alt: string;
    width: number;
    height: number;
    data?: Uint8Array;
}
export interface LinkData {
    href: string;
    text: string;
    title?: string;
    rel?: string;
}
export interface ContentMetadata {
    contentType: string;
    language: string;
    author?: string;
    publishedDate?: Date;
    modifiedDate?: Date;
    keywords: string[];
    description?: string;
    ogTags: {
        [key: string]: string;
    };
    schemaMarkup?: any;
}
export interface AutomationAction {
    id: string;
    type: ActionType;
    target?: string;
    value?: string;
    options?: any;
    requiresConfirmation: boolean;
    timeout: number;
}
export interface AutomationSequence {
    id: string;
    name: string;
    description: string;
    actions: AutomationAction[];
    createdBy: string;
    createdAt: Date;
    lastExecuted?: Date;
    successRate: number;
}
export interface AutomationResult {
    sequenceId: string;
    actionResults: ActionResult[];
    overallSuccess: boolean;
    executionTime: number;
    errors: string[];
    screenshots?: string[];
}
export interface ActionResult {
    actionId: string;
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    timestamp: Date;
}
export interface AIEvent {
    id: string;
    type: AIEventType;
    source: string;
    data: any;
    timestamp: Date;
    priority: EventPriority;
    requiresProcessing: boolean;
}
export interface AIState {
    isActive: boolean;
    currentTask?: string;
    performanceMetrics: PerformanceMetrics;
    activeExtractions: string[];
    activeAutomations: string[];
    lastActivity: Date;
}
export interface PerformanceMetrics {
    memoryUsage: number;
    cpuUsage: number;
    networkRequests: number;
    processingTime: number;
    errorRate: number;
}
export declare class AIIntegrationManager extends EventEmitter {
    private securityFramework;
    private processManager;
    private activeExtractions;
    private automationSequences;
    private aiState;
    private eventBuffer;
    private performanceMonitor;
    constructor(securityFramework: AuraSecurityFramework, processManager: AuraProcessManager);
    /**
     * Extract content from a web page with privacy protection
     */
    extractContent(tabId: string, url: string, options?: ContentExtractionOptions): Promise<ExtractedContent>;
    /**
     * Execute browser automation sequence
     */
    executeAutomation(sequenceId: string, confirmActions?: boolean): Promise<AutomationResult>;
    private initializeAutomationResult;
    private executeActions;
    private updateSequenceStats;
    /**
     * Create new automation sequence
     */
    createAutomationSequence(name: string, description: string, actions: AutomationAction[], createdBy: string): Promise<string>;
    /**
     * Monitor content changes in real-time
     */
    monitorContentChanges(tabId: string, url: string, callback: (changes: any) => void): Promise<string>;
    /**
     * Stop content monitoring
     */
    stopContentMonitoring(monitorId: string): Promise<void>;
    /**
     * Get current AI state
     */
    getAIState(): AIState;
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): PerformanceMetrics;
    /**
     * Emit AI event
     */
    emitAIEvent(event: Omit<AIEvent, 'id' | 'timestamp'>): void;
    /**
     * Process buffered AI events
     */
    processBufferedEvents(): Promise<void>;
    private initializeAIProcess;
    private startPerformanceMonitoring;
    private updatePerformanceMetrics;
    private sendToAIProcess;
    private waitForExtractionResult;
    private applyPrivacyFiltering;
    private executeAutomationAction;
    private requestUserConfirmation;
    private performAutomationAction;
    private takeScreenshot;
    private processAIEvent;
    private handleContentChange;
    private handleUserAction;
    private handlePerformanceEvent;
    private handleSecurityEvent;
    private handleAutomationEvent;
    destroy(): void;
}
//# sourceMappingURL=ai-integration-manager.d.ts.map