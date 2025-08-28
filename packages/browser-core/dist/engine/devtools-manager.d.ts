import { EventEmitter } from 'events';
import { PerformanceMetrics } from './performance-manager';
/**
 * DevToolsManager - Developer Tools Integration for Aura Browser
 *
 * Provides comprehensive developer tools including:
 * - AI-specific debugging panels and tools
 * - Browser state inspection and monitoring
 * - Performance profiling for AI operations
 * - Automated testing framework integration
 * - Unit and integration testing infrastructure
 */
export interface DevToolsPanel {
    id: string;
    name: string;
    icon: string;
    component: string;
    position: 'left' | 'right' | 'bottom';
    size: {
        width?: number;
        height?: number;
    };
    enabled: boolean;
    permissions: string[];
}
export interface DebugSession {
    id: string;
    type: 'ai' | 'browser' | 'extension' | 'performance';
    target: string;
    startTime: Date;
    endTime?: Date;
    breakpoints: Breakpoint[];
    callStack: CallStackFrame[];
    variables: Variable[];
    logs: DebugLog[];
    status: 'active' | 'paused' | 'stopped';
}
export interface Breakpoint {
    id: string;
    file: string;
    line: number;
    column?: number;
    condition?: string;
    enabled: boolean;
    hitCount: number;
}
export interface CallStackFrame {
    id: string;
    functionName: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    scope: VariableScope;
}
export interface Variable {
    name: string;
    value: any;
    type: string;
    scope: VariableScope;
    children?: Variable[];
}
export interface VariableScope {
    type: 'global' | 'local' | 'closure' | 'this';
    name: string;
}
export interface DebugLog {
    id: string;
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    source: string;
    data?: any;
}
export interface PerformanceProfile {
    id: string;
    name: string;
    type: 'cpu' | 'memory' | 'network' | 'render' | 'ai';
    startTime: Date;
    endTime?: Date;
    samples: PerformanceSample[];
    summary: PerformanceSummary;
}
export interface PerformanceSample {
    timestamp: Date;
    metrics: {
        cpuUsage?: number;
        memoryUsage?: number;
        networkRequests?: number;
        renderTime?: number;
        aiProcessingTime?: number;
        [key: string]: number | undefined;
    };
}
export interface PerformanceSummary {
    totalTime: number;
    averageCpuUsage: number;
    peakMemoryUsage: number;
    totalNetworkRequests: number;
    averageRenderTime: number;
    aiOperationsCount: number;
    bottlenecks: string[];
}
export interface TestSuite {
    id: string;
    name: string;
    description: string;
    tests: TestCase[];
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    timeout: number;
}
export interface TestCase {
    id: string;
    name: string;
    description: string;
    test: () => Promise<void>;
    timeout: number;
    retries: number;
    tags: string[];
}
export interface TestResult {
    suiteId: string;
    testId: string;
    status: 'passed' | 'failed' | 'skipped' | 'error';
    duration: number;
    error?: string;
    stackTrace?: string;
    assertions: TestAssertion[];
}
export interface TestAssertion {
    type: 'equal' | 'notEqual' | 'truthy' | 'falsy' | 'throws' | 'doesNotThrow';
    expected?: any;
    actual?: any;
    message: string;
    passed: boolean;
}
export interface BrowserStateSnapshot {
    id: string;
    timestamp: Date;
    tabs: TabState[];
    extensions: ExtensionState[];
    performance: PerformanceMetrics;
    memory: MemoryState;
    network: NetworkState;
}
export interface TabState {
    id: string;
    url: string;
    title: string;
    status: string;
    memoryUsage: number;
    cpuUsage: number;
    active: boolean;
}
export interface ExtensionState {
    id: string;
    name: string;
    enabled: boolean;
    memoryUsage: number;
    permissions: string[];
}
export interface MemoryState {
    used: number;
    total: number;
    pools: MemoryPoolState[];
}
export interface MemoryPoolState {
    name: string;
    used: number;
    available: number;
    allocations: number;
}
export interface NetworkState {
    activeRequests: number;
    totalRequests: number;
    bytesTransferred: number;
    connections: NetworkConnection[];
}
export interface NetworkConnection {
    id: string;
    url: string;
    status: string;
    bytesTransferred: number;
    startTime: Date;
}
export declare class DevToolsManager extends EventEmitter {
    private panels;
    private debugSessions;
    private performanceProfiles;
    private testSuites;
    private browserSnapshots;
    private maxSnapshots;
    constructor();
    /**
     * Register a DevTools panel
     */
    registerPanel(panel: DevToolsPanel): void;
    /**
     * Unregister a DevTools panel
     */
    unregisterPanel(panelId: string): void;
    /**
     * Get all registered panels
     */
    getPanels(): DevToolsPanel[];
    /**
     * Start a debug session
     */
    startDebugSession(type: DebugSession['type'], target: string): Promise<string>;
    /**
     * Stop a debug session
     */
    stopDebugSession(sessionId: string): Promise<void>;
    /**
     * Add a breakpoint
     */
    addBreakpoint(sessionId: string, breakpoint: Omit<Breakpoint, 'id' | 'hitCount'>): string;
    /**
     * Start performance profiling
     */
    startPerformanceProfile(name: string, type: PerformanceProfile['type']): Promise<string>;
    /**
     * Stop performance profiling
     */
    stopPerformanceProfile(profileId: string): Promise<PerformanceSummary>;
    /**
     * Register a test suite
     */
    registerTestSuite(suite: TestSuite): void;
    /**
     * Run a test suite
     */
    runTestSuite(suiteId: string): Promise<TestResult[]>;
    /**
     * Take a browser state snapshot
     */
    takeBrowserSnapshot(): Promise<string>;
    /**
     * Get browser snapshots
     */
    getBrowserSnapshots(limit?: number): BrowserStateSnapshot[];
    /**
     * Export debug data
     */
    exportDebugData(sessionId: string, format: 'json' | 'csv' | 'html'): Promise<string>;
    private initializeDefaultPanels;
    private initializeTestFramework;
    private attachDebugger;
    private detachDebugger;
    private attachProfiler;
    private detachProfiler;
    private generatePerformanceSummary;
    private createEmptySummary;
    private calculateMetrics;
    private identifyBottlenecks;
    private runTestCase;
    private captureBrowserState;
    private convertSessionToCSV;
    private convertSessionToHTML;
}
//# sourceMappingURL=devtools-manager.d.ts.map