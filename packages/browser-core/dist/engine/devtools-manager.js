"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevToolsManager = void 0;
const events_1 = require("events");
class DevToolsManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.panels = new Map();
        this.debugSessions = new Map();
        this.performanceProfiles = new Map();
        this.testSuites = new Map();
        this.browserSnapshots = [];
        this.maxSnapshots = 50;
        this.initializeDefaultPanels();
        this.initializeTestFramework();
    }
    /**
     * Register a DevTools panel
     */
    registerPanel(panel) {
        this.panels.set(panel.id, panel);
        this.emit('panelRegistered', panel);
    }
    /**
     * Unregister a DevTools panel
     */
    unregisterPanel(panelId) {
        const panel = this.panels.get(panelId);
        if (panel) {
            this.panels.delete(panelId);
            this.emit('panelUnregistered', panel);
        }
    }
    /**
     * Get all registered panels
     */
    getPanels() {
        return Array.from(this.panels.values());
    }
    /**
     * Start a debug session
     */
    async startDebugSession(type, target) {
        try {
            const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const session = {
                id: sessionId,
                type,
                target,
                startTime: new Date(),
                breakpoints: [],
                callStack: [],
                variables: [],
                logs: [],
                status: 'active'
            };
            this.debugSessions.set(sessionId, session);
            await this.attachDebugger(session);
            this.emit('debugSessionStarted', session);
            return sessionId;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Debug session start failed: ${error}`);
        }
    }
    /**
     * Stop a debug session
     */
    async stopDebugSession(sessionId) {
        try {
            const session = this.debugSessions.get(sessionId);
            if (!session) {
                throw new Error('Debug session not found');
            }
            session.status = 'stopped';
            session.endTime = new Date();
            await this.detachDebugger(session);
            this.debugSessions.delete(sessionId);
            this.emit('debugSessionStopped', session);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Debug session stop failed: ${error}`);
        }
    }
    /**
     * Add a breakpoint
     */
    addBreakpoint(sessionId, breakpoint) {
        const session = this.debugSessions.get(sessionId);
        if (!session) {
            throw new Error('Debug session not found');
        }
        const breakpointId = `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullBreakpoint = {
            ...breakpoint,
            id: breakpointId,
            hitCount: 0
        };
        session.breakpoints.push(fullBreakpoint);
        this.emit('breakpointAdded', { sessionId, breakpoint: fullBreakpoint });
        return breakpointId;
    }
    /**
     * Start performance profiling
     */
    async startPerformanceProfile(name, type) {
        try {
            const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const profile = {
                id: profileId,
                name,
                type,
                startTime: new Date(),
                samples: [],
                summary: {
                    totalTime: 0,
                    averageCpuUsage: 0,
                    peakMemoryUsage: 0,
                    totalNetworkRequests: 0,
                    averageRenderTime: 0,
                    aiOperationsCount: 0,
                    bottlenecks: []
                }
            };
            this.performanceProfiles.set(profileId, profile);
            await this.attachProfiler(profile);
            this.emit('performanceProfileStarted', profile);
            return profileId;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Performance profiling start failed: ${error}`);
        }
    }
    /**
     * Stop performance profiling
     */
    async stopPerformanceProfile(profileId) {
        try {
            const profile = this.performanceProfiles.get(profileId);
            if (!profile) {
                throw new Error('Performance profile not found');
            }
            profile.endTime = new Date();
            await this.detachProfiler(profile);
            const summary = this.generatePerformanceSummary(profile);
            profile.summary = summary;
            this.emit('performanceProfileStopped', { profile, summary });
            return summary;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Performance profiling stop failed: ${error}`);
        }
    }
    /**
     * Register a test suite
     */
    registerTestSuite(suite) {
        this.testSuites.set(suite.id, suite);
        this.emit('testSuiteRegistered', suite);
    }
    /**
     * Run a test suite
     */
    async runTestSuite(suiteId) {
        try {
            const suite = this.testSuites.get(suiteId);
            if (!suite) {
                throw new Error('Test suite not found');
            }
            const results = [];
            // Run setup
            if (suite.setup) {
                await suite.setup();
            }
            // Run each test
            for (const test of suite.tests) {
                const result = await this.runTestCase(suite, test);
                results.push(result);
            }
            // Run teardown
            if (suite.teardown) {
                await suite.teardown();
            }
            this.emit('testSuiteCompleted', { suite, results });
            return results;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Test suite execution failed: ${error}`);
        }
    }
    /**
     * Take a browser state snapshot
     */
    async takeBrowserSnapshot() {
        try {
            const snapshot = await this.captureBrowserState();
            const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            snapshot.id = snapshotId;
            this.browserSnapshots.push(snapshot);
            // Maintain max snapshots limit
            if (this.browserSnapshots.length > this.maxSnapshots) {
                this.browserSnapshots.shift();
            }
            this.emit('browserSnapshotTaken', snapshot);
            return snapshotId;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Browser snapshot failed: ${error}`);
        }
    }
    /**
     * Get browser snapshots
     */
    getBrowserSnapshots(limit = 10) {
        return this.browserSnapshots.slice(-limit);
    }
    /**
     * Export debug data
     */
    async exportDebugData(sessionId, format) {
        try {
            const session = this.debugSessions.get(sessionId);
            if (!session) {
                throw new Error('Debug session not found');
            }
            let exportData;
            switch (format) {
                case 'json':
                    exportData = JSON.stringify(session, null, 2);
                    break;
                case 'csv':
                    exportData = this.convertSessionToCSV(session);
                    break;
                case 'html':
                    exportData = this.convertSessionToHTML(session);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            this.emit('debugDataExported', { sessionId, format });
            return exportData;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Debug data export failed: ${error}`);
        }
    }
    // Private methods
    initializeDefaultPanels() {
        const defaultPanels = [
            {
                id: 'elements',
                name: 'Elements',
                icon: 'elements',
                component: 'ElementsPanel',
                position: 'left',
                size: { width: 300 },
                enabled: true,
                permissions: []
            },
            {
                id: 'console',
                name: 'Console',
                icon: 'console',
                component: 'ConsolePanel',
                position: 'bottom',
                size: { height: 200 },
                enabled: true,
                permissions: []
            },
            {
                id: 'sources',
                name: 'Sources',
                icon: 'sources',
                component: 'SourcesPanel',
                position: 'left',
                size: { width: 400 },
                enabled: true,
                permissions: []
            },
            {
                id: 'network',
                name: 'Network',
                icon: 'network',
                component: 'NetworkPanel',
                position: 'bottom',
                size: { height: 300 },
                enabled: true,
                permissions: []
            },
            {
                id: 'performance',
                name: 'Performance',
                icon: 'performance',
                component: 'PerformancePanel',
                position: 'bottom',
                size: { height: 300 },
                enabled: true,
                permissions: []
            },
            {
                id: 'ai-debug',
                name: 'AI Debug',
                icon: 'ai',
                component: 'AIDebugPanel',
                position: 'right',
                size: { width: 350 },
                enabled: true,
                permissions: ['ai']
            }
        ];
        for (const panel of defaultPanels) {
            this.registerPanel(panel);
        }
    }
    initializeTestFramework() {
        // Initialize testing framework infrastructure
        this.emit('testFrameworkInitialized');
    }
    async attachDebugger(session) {
        // Attach debugger to target
        this.emit('debuggerAttached', session);
    }
    async detachDebugger(session) {
        // Detach debugger from target
        this.emit('debuggerDetached', session);
    }
    async attachProfiler(profile) {
        // Attach performance profiler
        this.emit('profilerAttached', profile);
    }
    async detachProfiler(profile) {
        // Detach performance profiler
        this.emit('profilerDetached', profile);
    }
    generatePerformanceSummary(profile) {
        const samples = profile.samples;
        const totalTime = profile.endTime.getTime() - profile.startTime.getTime();
        if (samples.length === 0) {
            return this.createEmptySummary(totalTime);
        }
        const metrics = this.calculateMetrics(samples);
        return {
            totalTime,
            averageCpuUsage: metrics.avgCpu,
            peakMemoryUsage: metrics.peakMemory,
            totalNetworkRequests: metrics.totalNetwork,
            averageRenderTime: metrics.avgRender,
            aiOperationsCount: metrics.aiOps,
            bottlenecks: this.identifyBottlenecks(samples)
        };
    }
    createEmptySummary(totalTime) {
        return {
            totalTime,
            averageCpuUsage: 0,
            peakMemoryUsage: 0,
            totalNetworkRequests: 0,
            averageRenderTime: 0,
            aiOperationsCount: 0,
            bottlenecks: []
        };
    }
    calculateMetrics(samples) {
        const cpuUsages = samples.map(s => s.metrics.cpuUsage || 0).filter(u => u > 0);
        const memoryUsages = samples.map(s => s.metrics.memoryUsage || 0);
        const networkRequests = samples.map(s => s.metrics.networkRequests || 0);
        const renderTimes = samples.map(s => s.metrics.renderTime || 0).filter(t => t > 0);
        return {
            avgCpu: cpuUsages.length > 0 ? cpuUsages.reduce((a, b) => a + b) / cpuUsages.length : 0,
            peakMemory: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
            totalNetwork: networkRequests.reduce((a, b) => a + b, 0),
            avgRender: renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b) / renderTimes.length : 0,
            aiOps: samples.filter(s => (s.metrics.aiProcessingTime || 0) > 0).length
        };
    }
    identifyBottlenecks(samples) {
        const bottlenecks = [];
        const avgCpu = samples.reduce((sum, s) => sum + (s.metrics.cpuUsage || 0), 0) / samples.length;
        if (avgCpu > 80) {
            bottlenecks.push('High CPU usage');
        }
        const peakMemory = Math.max(...samples.map(s => s.metrics.memoryUsage || 0));
        if (peakMemory > 500 * 1024 * 1024) { // 500MB
            bottlenecks.push('High memory usage');
        }
        const avgRenderTime = samples.reduce((sum, s) => sum + (s.metrics.renderTime || 0), 0) / samples.length;
        if (avgRenderTime > 16) { // > 60fps
            bottlenecks.push('Slow rendering');
        }
        return bottlenecks;
    }
    async runTestCase(suite, test) {
        const startTime = Date.now();
        try {
            await test.test();
            return {
                suiteId: suite.id,
                testId: test.id,
                status: 'passed',
                duration: Date.now() - startTime,
                assertions: []
            };
        }
        catch (error) {
            return {
                suiteId: suite.id,
                testId: test.id,
                status: 'failed',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack : undefined,
                assertions: []
            };
        }
    }
    async captureBrowserState() {
        // Mock browser state capture
        return {
            id: '',
            timestamp: new Date(),
            tabs: [],
            extensions: [],
            performance: {
                timestamp: new Date(),
                memoryUsage: 0,
                memoryLimit: 0,
                cpuUsage: 0,
                gpuUsage: 0,
                networkLatency: 0,
                renderTime: 0,
                frameRate: 0,
                garbageCollectionTime: 0,
                activeConnections: 0
            },
            memory: {
                used: 0,
                total: 0,
                pools: []
            },
            network: {
                activeRequests: 0,
                totalRequests: 0,
                bytesTransferred: 0,
                connections: []
            }
        };
    }
    convertSessionToCSV(session) {
        // Convert debug session to CSV format
        return `timestamp,level,message,source\n${session.logs.map(log => `${log.timestamp.toISOString()},${log.level},${log.message},${log.source}`).join('\n')}`;
    }
    convertSessionToHTML(session) {
        // Convert debug session to HTML format
        return `
    <html>
    <head><title>Debug Session ${session.id}</title></head>
    <body>
    <h1>Debug Session ${session.id}</h1>
    <h2>Logs</h2>
    <ul>
    ${session.logs.map(log => `<li>[${log.level}] ${log.message}</li>`).join('')}
    </ul>
    </body>
    </html>`;
    }
}
exports.DevToolsManager = DevToolsManager;
//# sourceMappingURL=devtools-manager.js.map