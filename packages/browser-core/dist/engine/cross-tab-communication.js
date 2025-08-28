"use strict";
// Cross-Tab Communication System for Aura Browser
// Enables secure communication, shared contexts, and collaboration between tabs
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuraCrossTabCommunication = exports.CollaborationType = exports.MessagePriority = exports.MessageType = void 0;
exports.createCrossTabCommunication = createCrossTabCommunication;
const events_1 = require("events");
const chromium_engine_1 = require("./chromium-engine");
const process_manager_1 = require("./process-manager");
var MessageType;
(function (MessageType) {
    // Data sharing
    MessageType["SHARED_DATA_UPDATE"] = "shared_data_update";
    MessageType["SHARED_DATA_REQUEST"] = "shared_data_request";
    MessageType["SHARED_DATA_RESPONSE"] = "shared_data_response";
    // Collaboration
    MessageType["COLLABORATION_JOIN"] = "collaboration_join";
    MessageType["COLLABORATION_LEAVE"] = "collaboration_leave";
    MessageType["COLLABORATION_UPDATE"] = "collaboration_update";
    MessageType["COLLABORATION_CURSOR"] = "collaboration_cursor";
    MessageType["COLLABORATION_SELECTION"] = "collaboration_selection";
    // AI features
    MessageType["AI_CONTEXT_SHARE"] = "ai_context_share";
    MessageType["AI_SUGGESTION"] = "ai_suggestion";
    MessageType["AI_ANALYSIS_REQUEST"] = "ai_analysis_request";
    MessageType["AI_ANALYSIS_RESPONSE"] = "ai_analysis_response";
    // System events
    MessageType["TAB_STATE_CHANGE"] = "tab_state_change";
    MessageType["TAB_FOCUS_CHANGE"] = "tab_focus_change";
    MessageType["TAB_CONTENT_UPDATE"] = "tab_content_update";
    // Custom messages
    MessageType["CUSTOM"] = "custom";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessagePriority;
(function (MessagePriority) {
    MessagePriority["LOW"] = "low";
    MessagePriority["NORMAL"] = "normal";
    MessagePriority["HIGH"] = "high";
    MessagePriority["URGENT"] = "urgent";
})(MessagePriority || (exports.MessagePriority = MessagePriority = {}));
var CollaborationType;
(function (CollaborationType) {
    CollaborationType["DOCUMENT_EDITING"] = "document_editing";
    CollaborationType["RESEARCH_SESSION"] = "research_session";
    CollaborationType["AI_ASSISTED_WORKFLOW"] = "ai_assisted_workflow";
    CollaborationType["CUSTOM"] = "custom";
})(CollaborationType || (exports.CollaborationType = CollaborationType = {}));
// Main Cross-Tab Communication Implementation
class AuraCrossTabCommunication extends events_1.EventEmitter {
    constructor(ipcManager, tabManager) {
        super();
        this.sharedContexts = new Map();
        this.collaborationSessions = new Map();
        this.messageHandlers = new Map();
        this.tabConnections = new Map();
        this.permissions = new Map(); // fromTab -> toTab -> permissions
        this.conflicts = new Map();
        this.subscriptions = new Map();
        this.ipcManager = ipcManager;
        this.tabManager = tabManager;
        this.initializeSystem();
    }
    async sendMessage(message) {
        if (!message.toTabId) {
            throw new Error('toTabId is required for direct messages');
        }
        // Check permissions
        if (!(await this.checkMessagePermission(message))) {
            throw new Error(`Permission denied for message type ${message.type}`);
        }
        // Ensure IPC channel exists between tabs
        await this.ensureChannel(message.fromTabId, message.toTabId);
        // Create IPC message
        const ipcMessage = {
            id: message.id,
            type: 'cross_tab_message',
            from: message.fromTabId,
            to: message.toTabId,
            payload: message,
            timestamp: message.timestamp,
            requiresResponse: message.requiresResponse
        };
        // Send via IPC
        await this.ipcManager.sendMessage(ipcMessage);
        // Update connection stats
        this.updateConnectionStats(message.fromTabId, message.toTabId);
        // Emit event
        this.emit('message-sent', message);
    }
    async broadcastMessage(message) {
        const tabs = await this.tabManager.listTabs();
        const activeTabs = tabs.filter(tab => tab.status !== chromium_engine_1.TabStatus.Suspended);
        // Send to all active tabs except sender
        const promises = activeTabs
            .filter(tab => tab.id !== message.fromTabId)
            .map(tab => this.sendMessage({ ...message, toTabId: tab.id }));
        await Promise.all(promises);
        this.emit('message-broadcast', message);
    }
    subscribeToMessages(handler) {
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subscription = {
            unsubscribe: () => {
                const handlers = this.messageHandlers.get('all') || [];
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
                this.subscriptions.delete(subscriptionId);
            },
            id: subscriptionId
        };
        if (!this.messageHandlers.has('all')) {
            this.messageHandlers.set('all', []);
        }
        this.messageHandlers.get('all').push(handler);
        this.subscriptions.set(subscriptionId, subscription);
        return subscription;
    }
    subscribeToTab(tabId, handler) {
        const subscriptionId = `sub_tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subscription = {
            unsubscribe: () => {
                const handlers = this.messageHandlers.get(tabId) || [];
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
                this.subscriptions.delete(subscriptionId);
            },
            id: subscriptionId
        };
        if (!this.messageHandlers.has(tabId)) {
            this.messageHandlers.set(tabId, []);
        }
        this.messageHandlers.get(tabId).push(handler);
        this.subscriptions.set(subscriptionId, subscription);
        return subscription;
    }
    async createSharedContext(name, initialData = {}, permissions = {}) {
        const contextId = `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentTab = await this.getCurrentTab();
        const context = {
            id: contextId,
            name,
            ownerTabId: currentTab.id,
            participants: [currentTab.id],
            data: new Map(Object.entries(initialData)),
            permissions: {
                read: permissions.read || [currentTab.id],
                write: permissions.write || [currentTab.id],
                admin: permissions.admin || [currentTab.id],
                public: permissions.public || false
            },
            createdAt: new Date(),
            lastModified: new Date(),
            version: 1
        };
        this.sharedContexts.set(contextId, context);
        this.emit('shared-context-created', context);
        return context;
    }
    async joinSharedContext(contextId) {
        const context = this.sharedContexts.get(contextId);
        if (!context) {
            throw new Error(`Shared context ${contextId} not found`);
        }
        const currentTab = await this.getCurrentTab();
        if (!context.permissions.public && !context.permissions.read.includes(currentTab.id)) {
            throw new Error('Permission denied to join shared context');
        }
        if (!context.participants.includes(currentTab.id)) {
            context.participants.push(currentTab.id);
            this.emit('shared-context-joined', { context, tabId: currentTab.id });
        }
        return context;
    }
    async leaveSharedContext(contextId) {
        const context = this.sharedContexts.get(contextId);
        if (!context) {
            return;
        }
        const currentTab = await this.getCurrentTab();
        const index = context.participants.indexOf(currentTab.id);
        if (index > -1) {
            context.participants.splice(index, 1);
            this.emit('shared-context-left', { context, tabId: currentTab.id });
            // Clean up empty contexts
            if (context.participants.length === 0) {
                this.sharedContexts.delete(contextId);
                this.emit('shared-context-destroyed', context);
            }
        }
    }
    async updateSharedData(contextId, key, value) {
        const context = this.sharedContexts.get(contextId);
        if (!context) {
            throw new Error(`Shared context ${contextId} not found`);
        }
        const currentTab = await this.getCurrentTab();
        if (!context.permissions.write.includes(currentTab.id) && !context.permissions.admin.includes(currentTab.id)) {
            throw new Error('Permission denied to update shared data');
        }
        // Check for conflicts
        const existingValue = context.data.get(key);
        if (existingValue !== undefined && existingValue !== value) {
            await this.handleDataConflict(context, key, existingValue, value, currentTab.id);
        }
        context.data.set(key, value);
        context.lastModified = new Date();
        context.version++;
        // Broadcast update to all participants
        const updateMessage = {
            id: `update_${Date.now()}`,
            fromTabId: currentTab.id,
            type: MessageType.SHARED_DATA_UPDATE,
            payload: { contextId, key, value, version: context.version },
            timestamp: new Date(),
            priority: MessagePriority.NORMAL
        };
        await this.broadcastToParticipants(context.participants, updateMessage);
        this.emit('shared-data-updated', { context, key, value, tabId: currentTab.id });
    }
    async getSharedData(contextId, key) {
        const context = this.sharedContexts.get(contextId);
        if (!context) {
            throw new Error(`Shared context ${contextId} not found`);
        }
        const currentTab = await this.getCurrentTab();
        if (!context.permissions.read.includes(currentTab.id) && !context.permissions.admin.includes(currentTab.id)) {
            throw new Error('Permission denied to read shared data');
        }
        if (key) {
            return context.data.get(key);
        }
        return Object.fromEntries(context.data);
    }
    async listSharedContexts() {
        const currentTab = await this.getCurrentTab();
        return Array.from(this.sharedContexts.values())
            .filter(context => context.permissions.public ||
            context.permissions.read.includes(currentTab.id) ||
            context.permissions.admin.includes(currentTab.id));
    }
    async createCollaborationSession(name, type, settings = {}) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentTab = await this.getCurrentTab();
        const session = {
            id: sessionId,
            name,
            type,
            participants: [{
                    tabId: currentTab.id,
                    role: 'owner',
                    joinedAt: new Date(),
                    lastActivity: new Date(),
                    permissions: ['read', 'write', 'admin']
                }],
            sharedContexts: [],
            settings: {
                realTimeUpdates: true,
                conflictResolution: 'manual',
                aiAssistance: true,
                recordingEnabled: false,
                maxParticipants: 10,
                idleTimeout: 30,
                ...settings
            },
            createdAt: new Date(),
            lastActivity: new Date(),
            status: 'active'
        };
        this.collaborationSessions.set(sessionId, session);
        this.emit('collaboration-session-created', session);
        return session;
    }
    async joinCollaborationSession(sessionId) {
        const session = this.collaborationSessions.get(sessionId);
        if (!session) {
            throw new Error(`Collaboration session ${sessionId} not found`);
        }
        if (session.status !== 'active') {
            throw new Error('Collaboration session is not active');
        }
        if (session.participants.length >= session.settings.maxParticipants) {
            throw new Error('Collaboration session is full');
        }
        const currentTab = await this.getCurrentTab();
        if (session.participants.some(p => p.tabId === currentTab.id)) {
            return session; // Already joined
        }
        session.participants.push({
            tabId: currentTab.id,
            role: 'editor',
            joinedAt: new Date(),
            lastActivity: new Date(),
            permissions: ['read', 'write']
        });
        this.emit('collaboration-session-joined', { session, tabId: currentTab.id });
        return session;
    }
    async leaveCollaborationSession(sessionId) {
        const session = this.collaborationSessions.get(sessionId);
        if (!session) {
            return;
        }
        const currentTab = await this.getCurrentTab();
        const participantIndex = session.participants.findIndex(p => p.tabId === currentTab.id);
        if (participantIndex > -1) {
            session.participants.splice(participantIndex, 1);
            this.emit('collaboration-session-left', { session, tabId: currentTab.id });
            // End session if owner leaves or no participants left
            if (session.participants.length === 0 ||
                (session.participants[0]?.role === 'owner' && session.participants[0]?.tabId === currentTab.id)) {
                session.status = 'ended';
                this.emit('collaboration-session-ended', session);
            }
        }
    }
    async updateCollaborationState(sessionId, updates) {
        const session = this.collaborationSessions.get(sessionId);
        if (!session) {
            throw new Error(`Collaboration session ${sessionId} not found`);
        }
        const currentTab = await this.getCurrentTab();
        const participant = session.participants.find(p => p.tabId === currentTab.id);
        if (!participant) {
            throw new Error('Not a participant in this collaboration session');
        }
        Object.assign(participant, updates);
        participant.lastActivity = new Date();
        session.lastActivity = new Date();
        // Broadcast state update
        const stateMessage = {
            id: `state_${Date.now()}`,
            fromTabId: currentTab.id,
            type: MessageType.COLLABORATION_UPDATE,
            payload: { sessionId, participant: updates },
            timestamp: new Date(),
            priority: MessagePriority.NORMAL
        };
        await this.broadcastToParticipants(session.participants.map(p => p.tabId), stateMessage);
        this.emit('collaboration-state-updated', { session, participant, updates });
    }
    async listCollaborationSessions() {
        return Array.from(this.collaborationSessions.values())
            .filter(session => session.status === 'active');
    }
    async requestPermission(fromTabId, toTabId, permission) {
        // Send permission request message
        const requestMessage = {
            id: `perm_req_${Date.now()}`,
            fromTabId,
            toTabId,
            type: MessageType.CUSTOM,
            payload: { type: 'permission_request', permission },
            timestamp: new Date(),
            priority: MessagePriority.NORMAL,
            requiresResponse: true
        };
        await this.sendMessage(requestMessage);
        // Wait for response (simplified - in real implementation would use promises/futures)
        return true;
    }
    async grantPermission(fromTabId, toTabId, permission) {
        if (!this.permissions.has(fromTabId)) {
            this.permissions.set(fromTabId, new Map());
        }
        const tabPermissions = this.permissions.get(fromTabId);
        if (!tabPermissions.has(toTabId)) {
            tabPermissions.set(toTabId, []);
        }
        const permissionList = tabPermissions.get(toTabId);
        if (!permissionList.includes(permission)) {
            permissionList.push(permission);
        }
        this.emit('permission-granted', { fromTabId, toTabId, permission });
    }
    async revokePermission(fromTabId, toTabId, permission) {
        const tabPermissions = this.permissions.get(fromTabId);
        if (tabPermissions) {
            const permissionList = tabPermissions.get(toTabId);
            if (permissionList) {
                const index = permissionList.indexOf(permission);
                if (index > -1) {
                    permissionList.splice(index, 1);
                }
            }
        }
        this.emit('permission-revoked', { fromTabId, toTabId, permission });
    }
    async checkPermission(fromTabId, toTabId, permission) {
        const tabPermissions = this.permissions.get(fromTabId);
        if (!tabPermissions) {
            return false;
        }
        const permissionList = tabPermissions.get(toTabId);
        return permissionList ? permissionList.includes(permission) : false;
    }
    async resolveConflict(contextId, key, conflictingValues) {
        const context = this.sharedContexts.get(contextId);
        if (!context) {
            throw new Error(`Shared context ${contextId} not found`);
        }
        let resolvedValue;
        switch (context.permissions.admin.length > 0 ? 'owner_priority' : 'automatic') {
            case 'owner_priority':
                // Use owner's value
                const ownerValue = conflictingValues.find(v => v.tabId === context.ownerTabId);
                resolvedValue = ownerValue ? ownerValue.value : conflictingValues[0].value;
                break;
            case 'automatic':
                // Simple merge strategy - last writer wins
                resolvedValue = conflictingValues[conflictingValues.length - 1].value;
                break;
            default: // manual
                // Return first value and let user resolve manually
                resolvedValue = conflictingValues[0].value;
                break;
        }
        // Record conflict resolution
        const conflictRecord = {
            id: `conflict_${Date.now()}`,
            contextId,
            key,
            conflictingValues,
            resolvedValue,
            resolvedAt: new Date(),
            resolutionMethod: context.permissions.admin.length > 0 ? 'owner_priority' : 'automatic'
        };
        if (!this.conflicts.has(contextId)) {
            this.conflicts.set(contextId, []);
        }
        this.conflicts.get(contextId).push(conflictRecord);
        return resolvedValue;
    }
    async getConflictHistory(contextId) {
        return this.conflicts.get(contextId) || [];
    }
    async getConnectedTabs() {
        const tabs = await this.tabManager.listTabs();
        return tabs.filter(tab => this.tabConnections.has(tab.id));
    }
    async getTabConnections(tabId) {
        const connections = [];
        const tabs = await this.tabManager.listTabs();
        for (const tab of tabs) {
            if (tab.id !== tabId && this.tabConnections.has(tab.id)) {
                const connection = this.tabConnections.get(tab.id);
                if (connection.status === 'connected') {
                    connections.push(connection);
                }
            }
        }
        return connections;
    }
    async cleanup() {
        // Clean up inactive connections
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutes
        for (const [tabId, connection] of this.tabConnections) {
            if (connection.lastMessageAt && (now - connection.lastMessageAt.getTime()) > timeout) {
                connection.status = 'disconnected';
                this.emit('connection-timeout', { tabId, connection });
            }
        }
        // Clean up ended collaboration sessions
        for (const [sessionId, session] of this.collaborationSessions) {
            if (session.status === 'ended') {
                this.collaborationSessions.delete(sessionId);
            }
        }
        // Clean up empty shared contexts
        for (const [contextId, context] of this.sharedContexts) {
            if (context.participants.length === 0) {
                this.sharedContexts.delete(contextId);
            }
        }
    }
    async initializeSystem() {
        // Set up IPC message handling
        const subscription = this.ipcManager.subscribeToChannel('cross_tab_messages', (ipcMessage) => {
            const crossTabMessage = ipcMessage.payload;
            // Route message to appropriate handlers
            const allHandlers = this.messageHandlers.get('all') || [];
            const tabHandlers = this.messageHandlers.get(crossTabMessage.toTabId || crossTabMessage.fromTabId) || [];
            [...allHandlers, ...tabHandlers].forEach(handler => {
                try {
                    handler(crossTabMessage);
                }
                catch (error) {
                    console.error('Error handling cross-tab message:', error);
                }
            });
            this.emit('message-received', crossTabMessage);
        });
        this.subscriptions.set('ipc_subscription', subscription);
    }
    async checkMessagePermission(message) {
        // Basic permission check - can be extended with more sophisticated rules
        if (message.type === MessageType.CUSTOM) {
            return true; // Allow custom messages by default
        }
        // Check if sender has permission to send this type of message
        return await this.checkPermission(message.fromTabId, message.toTabId, message.type);
    }
    async handleDataConflict(context, key, existingValue, newValue, tabId) {
        const conflictingValues = [
            { value: existingValue, tabId: context.ownerTabId, timestamp: context.lastModified },
            { value: newValue, tabId, timestamp: new Date() }
        ];
        const resolvedValue = await this.resolveConflict(context.id, key, conflictingValues);
        context.data.set(key, resolvedValue);
    }
    async broadcastToParticipants(participantIds, message) {
        const promises = participantIds
            .filter(tabId => tabId !== message.fromTabId)
            .map(tabId => this.sendMessage({ ...message, toTabId: tabId }));
        await Promise.all(promises);
    }
    updateConnectionStats(fromTabId, toTabId) {
        // Update connection stats for both directions
        [fromTabId, toTabId].forEach(tabId => {
            if (!this.tabConnections.has(tabId)) {
                this.tabConnections.set(tabId, {
                    tabId,
                    connectedAt: new Date(),
                    messageCount: 0,
                    permissions: [],
                    status: 'connected'
                });
            }
            const connection = this.tabConnections.get(tabId);
            connection.lastMessageAt = new Date();
            connection.messageCount++;
        });
    }
    async ensureChannel(fromTabId, toTabId) {
        const channelId = `cross_tab_${fromTabId}_${toTabId}`;
        try {
            // Try to get existing channel
            await this.ipcManager.getChannelInfo(channelId);
        }
        catch {
            // Channel doesn't exist, create it
            await this.ipcManager.createChannel(`Cross-tab communication: ${fromTabId} ↔ ${toTabId}`, process_manager_1.ChannelType.Data, [fromTabId, toTabId]);
        }
    }
    async getCurrentTab() {
        // This would need to be implemented based on the current execution context
        // For now, return a placeholder
        const tabs = await this.tabManager.listTabs();
        return tabs[0] || {
            id: 'current_tab',
            url: 'about:blank',
            title: 'Current Tab',
            status: chromium_engine_1.TabStatus.Complete,
            spaceId: 'default',
            suspended: false,
            lastActive: new Date(),
            memoryUsage: 0,
            createdAt: new Date()
        };
    }
}
exports.AuraCrossTabCommunication = AuraCrossTabCommunication;
// Factory function
function createCrossTabCommunication(ipcManager, tabManager) {
    return new AuraCrossTabCommunication(ipcManager, tabManager);
}
//# sourceMappingURL=cross-tab-communication.js.map