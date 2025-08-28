// Chromium Engine Wrapper for Project Aura
// Provides TypeScript interfaces and wrapper classes for the customized Chromium build

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

export enum TabStatus {
  Loading = 'loading',
  Complete = 'complete',
  Error = 'error',
  Suspended = 'suspended'
}

// Native bindings interface (will be implemented by native addon)
export interface NativeChromiumEngine {
  createTab(url: string, options?: TabOptions): Promise<string>; // Returns tabId
  destroyTab(tabId: string): Promise<void>;
  navigateTab(tabId: string, url: string): Promise<void>;
  extractContent(tabId: string, options?: ExtractionOptions): Promise<PageContent>;
  injectScript(tabId: string, script: string): Promise<any>;
  addEventListener(eventType: string, callback: (event: BrowserEvent) => void): void;
  removeEventListener(eventType: string, callback: (event: BrowserEvent) => void): void;
}

// TypeScript wrapper class
export class AuraChromiumEngine implements ChromiumEngine {
  private nativeEngine: NativeChromiumEngine;
  private eventListeners: Map<string, EventHandler[]> = new Map();

  constructor(nativeEngine: NativeChromiumEngine) {
    this.nativeEngine = nativeEngine;
    this.setupNativeEventForwarding();
  }

  async createTab(url: string, options?: TabOptions): Promise<Tab> {
    try {
      const tabId = await this.nativeEngine.createTab(url, options);

      // Wait for tab creation event to get full tab info
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Tab creation timeout'));
        }, 10000);

        const handler = (event: BrowserEvent) => {
          if (event.type === 'tab-created' && event.tabId === tabId) {
            clearTimeout(timeout);
            this.removeEventListener(event, handler);
            resolve(event.data as Tab);
          }
        };

        this.addEventListener({ type: 'tab-created', tabId }, handler);
      });
    } catch (error) {
      throw new Error(`Failed to create tab: ${error}`);
    }
  }

  async destroyTab(tabId: string): Promise<void> {
    try {
      await this.nativeEngine.destroyTab(tabId);
    } catch (error) {
      throw new Error(`Failed to destroy tab: ${error}`);
    }
  }

  async navigateTab(tabId: string, url: string): Promise<void> {
    try {
      await this.nativeEngine.navigateTab(tabId, url);
    } catch (error) {
      throw new Error(`Failed to navigate tab: ${error}`);
    }
  }

  async extractContent(tabId: string, options?: ExtractionOptions): Promise<PageContent> {
    try {
      const content = await this.nativeEngine.extractContent(tabId, options);

      // Apply privacy filtering if requested
      if (options?.respectPrivacy) {
        return this.filterSensitiveContent(content);
      }

      return content;
    } catch (error) {
      throw new Error(`Failed to extract content: ${error}`);
    }
  }

  async injectScript(tabId: string, script: string): Promise<any> {
    try {
      return await this.nativeEngine.injectScript(tabId, script);
    } catch (error) {
      throw new Error(`Failed to inject script: ${error}`);
    }
  }

  addEventListener(event: BrowserEvent, handler: EventHandler): void {
    const key = `${event.type}:${event.tabId}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key)!.push(handler);
  }

  removeEventListener(event: BrowserEvent, handler: EventHandler): void {
    const key = `${event.type}:${event.tabId}`;
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      const index = listeners.indexOf(handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private setupNativeEventForwarding(): void {
    // Forward native events to TypeScript listeners
    this.nativeEngine.addEventListener('all', (event: BrowserEvent) => {
      const key = `${event.type}:${event.tabId}`;
      const listeners = this.eventListeners.get(key);
      if (listeners) {
        listeners.forEach(handler => handler(event));
      }
    });
  }

  private filterSensitiveContent(content: PageContent): PageContent {
    // Implement privacy filtering logic
    // This is a placeholder - actual implementation would use more sophisticated filtering
    const filteredContent = { ...content };

    // Remove potential PII patterns (basic implementation)
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    ];

    piiPatterns.forEach(pattern => {
      filteredContent.text = filteredContent.text.replace(pattern, '[REDACTED]');
      filteredContent.html = filteredContent.html.replace(pattern, '[REDACTED]');
    });

    return filteredContent;
  }
}

// Factory function to create engine instance
export function createChromiumEngine(nativeEngine: NativeChromiumEngine): ChromiumEngine {
  return new AuraChromiumEngine(nativeEngine);
}
