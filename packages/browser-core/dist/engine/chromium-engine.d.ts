export interface TabOptions {
    background?: boolean;
    parentTabId?: string;
    groupId?: string;
    spaceId?: string;
    aiEnabled?: boolean;
}
export interface PageContent {
    title: string;
    url: string;
    text: string;
    html: string;
    metadata: PageMetadata;
    elements: ExtractedElement[];
    aiContext?: AIContext;
}
export interface PageMetadata {
    description?: string;
    keywords?: string[];
    author?: string;
    publishedDate?: Date;
    modifiedDate?: Date;
    contentType: string;
    language?: string;
}
export interface BoundingRect {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface ExtractedElement {
    tagName: string;
    id?: string;
    className?: string;
    textContent: string;
    innerHTML: string;
    boundingRect?: BoundingRect;
    aiRelevance?: number;
}
export interface AIContext {
    summary?: string;
    topics?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    readingLevel?: number;
    contentType?: 'article' | 'documentation' | 'social' | 'commerce' | 'other';
}
export interface ExtractionOptions {
    includeText?: boolean;
    includeHTML?: boolean;
    includeMetadata?: boolean;
    respectPrivacy?: boolean;
    maxContentLength?: number;
    includeAIContext?: boolean;
}
export interface BrowserEvent {
    type: 'tab-created' | 'tab-destroyed' | 'navigation' | 'content-loaded' | 'ai-context-ready';
    tabId: string;
    data?: any;
}
export type EventHandler = (event: BrowserEvent) => void;
export interface ChromiumEngine {
    createTab(url: string, options?: TabOptions): Promise<Tab>;
    destroyTab(tabId: string): Promise<void>;
    navigateTab(tabId: string, url: string): Promise<void>;
    extractContent(tabId: string, options?: ExtractionOptions): Promise<PageContent>;
    injectScript(tabId: string, script: string): Promise<any>;
    addEventListener(event: BrowserEvent, handler: EventHandler): void;
    removeEventListener(event: BrowserEvent, handler: EventHandler): void;
}
export interface Tab {
    id: string;
    url: string;
    title: string;
    favicon?: string;
    status: TabStatus;
    groupId?: string;
    spaceId: string;
    suspended: boolean;
    lastActive: Date;
    memoryUsage: number;
    aiContext?: AIContext;
    createdAt: Date;
}
export declare enum TabStatus {
    Loading = "loading",
    Complete = "complete",
    Error = "error",
    Suspended = "suspended"
}
export interface NativeChromiumEngine {
    createTab(url: string, options?: TabOptions): Promise<string>;
    destroyTab(tabId: string): Promise<void>;
    navigateTab(tabId: string, url: string): Promise<void>;
    extractContent(tabId: string, options?: ExtractionOptions): Promise<PageContent>;
    injectScript(tabId: string, script: string): Promise<any>;
    addEventListener(eventType: string, callback: (event: BrowserEvent) => void): void;
    removeEventListener(eventType: string, callback: (event: BrowserEvent) => void): void;
}
export declare class AuraChromiumEngine implements ChromiumEngine {
    private nativeEngine;
    private eventListeners;
    constructor(nativeEngine: NativeChromiumEngine);
    createTab(url: string, options?: TabOptions): Promise<Tab>;
    destroyTab(tabId: string): Promise<void>;
    navigateTab(tabId: string, url: string): Promise<void>;
    extractContent(tabId: string, options?: ExtractionOptions): Promise<PageContent>;
    injectScript(tabId: string, script: string): Promise<any>;
    addEventListener(event: BrowserEvent, handler: EventHandler): void;
    removeEventListener(event: BrowserEvent, handler: EventHandler): void;
    private setupNativeEventForwarding;
    private filterSensitiveContent;
}
export declare function createChromiumEngine(nativeEngine: NativeChromiumEngine): ChromiumEngine;
//# sourceMappingURL=chromium-engine.d.ts.map