"use strict";
// Chromium Engine Wrapper for Project Aura
// Provides TypeScript interfaces and wrapper classes for the customized Chromium build
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuraChromiumEngine = exports.TabStatus = void 0;
exports.createChromiumEngine = createChromiumEngine;
var TabStatus;
(function (TabStatus) {
    TabStatus["Loading"] = "loading";
    TabStatus["Complete"] = "complete";
    TabStatus["Error"] = "error";
    TabStatus["Suspended"] = "suspended";
})(TabStatus || (exports.TabStatus = TabStatus = {}));
// TypeScript wrapper class
class AuraChromiumEngine {
    constructor(nativeEngine) {
        this.eventListeners = new Map();
        this.nativeEngine = nativeEngine;
        this.setupNativeEventForwarding();
    }
    async createTab(url, options) {
        try {
            const tabId = await this.nativeEngine.createTab(url, options);
            // Wait for tab creation event to get full tab info
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Tab creation timeout'));
                }, 10000);
                const handler = (event) => {
                    if (event.type === 'tab-created' && event.tabId === tabId) {
                        clearTimeout(timeout);
                        this.removeEventListener(event, handler);
                        resolve(event.data);
                    }
                };
                this.addEventListener({ type: 'tab-created', tabId }, handler);
            });
        }
        catch (error) {
            throw new Error(`Failed to create tab: ${error}`);
        }
    }
    async destroyTab(tabId) {
        try {
            await this.nativeEngine.destroyTab(tabId);
        }
        catch (error) {
            throw new Error(`Failed to destroy tab: ${error}`);
        }
    }
    async navigateTab(tabId, url) {
        try {
            await this.nativeEngine.navigateTab(tabId, url);
        }
        catch (error) {
            throw new Error(`Failed to navigate tab: ${error}`);
        }
    }
    async extractContent(tabId, options) {
        try {
            const content = await this.nativeEngine.extractContent(tabId, options);
            // Apply privacy filtering if requested
            if (options?.respectPrivacy) {
                return this.filterSensitiveContent(content);
            }
            return content;
        }
        catch (error) {
            throw new Error(`Failed to extract content: ${error}`);
        }
    }
    async injectScript(tabId, script) {
        try {
            return await this.nativeEngine.injectScript(tabId, script);
        }
        catch (error) {
            throw new Error(`Failed to inject script: ${error}`);
        }
    }
    addEventListener(event, handler) {
        const key = `${event.type}:${event.tabId}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key).push(handler);
    }
    removeEventListener(event, handler) {
        const key = `${event.type}:${event.tabId}`;
        const listeners = this.eventListeners.get(key);
        if (listeners) {
            const index = listeners.indexOf(handler);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    setupNativeEventForwarding() {
        // Forward native events to TypeScript listeners
        this.nativeEngine.addEventListener('all', (event) => {
            const key = `${event.type}:${event.tabId}`;
            const listeners = this.eventListeners.get(key);
            if (listeners) {
                listeners.forEach(handler => handler(event));
            }
        });
    }
    filterSensitiveContent(content) {
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
exports.AuraChromiumEngine = AuraChromiumEngine;
// Factory function to create engine instance
function createChromiumEngine(nativeEngine) {
    return new AuraChromiumEngine(nativeEngine);
}
//# sourceMappingURL=chromium-engine.js.map