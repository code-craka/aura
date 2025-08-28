import { EventEmitter } from 'events';
import { AuraSecurityFramework } from './security/security-framework';
import { AuraIPCManager, AuraProcessManager } from './process-manager';
import { AuraEventBus } from './event-system';
import { AuraTabManager } from './tab-manager';
import { ExtensionManager } from './extensions/extension-manager';
import { AIIntegrationManager } from './ai-integration-manager';
import { PerformanceManager } from './performance-manager';
import { PlatformManager } from './platform-manager';
import { DevToolsManager } from './devtools-manager';
import { AuraSettingsManager } from './settings-manager';
export interface TestSuite {
    id: string;
    name: string;
    description: string;
    category: TestCategory;
    tests: TestCase[];
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
}
export interface TestCase {
    id: string;
    name: string;
    description: string;
    category: TestCategory;
    priority: TestPriority;
    timeout: number;
    testFunction: (context: TestContext) => Promise<TestResult>;
    dependencies?: string[];
    tags?: string[];
}
export interface TestContext {
    security: AuraSecurityFramework;
    ipcManager: AuraIPCManager;
    processManager: AuraProcessManager;
    eventBus: AuraEventBus;
    tabManager: AuraTabManager;
    extensionManager: ExtensionManager;
    aiManager: AIIntegrationManager;
    performanceManager: PerformanceManager;
    platformManager: PlatformManager;
    devToolsManager: DevToolsManager;
    settingsManager: AuraSettingsManager;
    tempData: Map<string, any>;
}
export interface TestResult {
    testId: string;
    success: boolean;
    duration: number;
    error?: string;
    warnings?: string[];
    metrics?: Record<string, any>;
    screenshots?: string[];
    logs?: string[];
}
export interface TestReport {
    suiteId: string;
    suiteName: string;
    timestamp: Date;
    duration: number;
    results: TestResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        warnings: number;
    };
    systemInfo: {
        platform: string;
        nodeVersion: string;
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: number;
    };
    recommendations?: string[];
}
export declare enum TestCategory {
    UNIT = "unit",
    INTEGRATION = "integration",
    PERFORMANCE = "performance",
    SECURITY = "security",
    COMPATIBILITY = "compatibility",
    AI_INTEGRATION = "ai_integration",
    END_TO_END = "end_to_end"
}
export declare enum TestPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface PerformanceBenchmark {
    name: string;
    category: string;
    baseline: number;
    unit: string;
    tolerance: number;
    measureFunction: (context: TestContext) => Promise<number>;
}
export interface SecurityTestScenario {
    name: string;
    description: string;
    attackVector: string;
    expectedResult: 'block' | 'allow' | 'warn';
    testFunction: (context: TestContext) => Promise<boolean>;
}
export interface CompatibilityMatrix {
    platforms: string[];
    browsers: string[];
    nodeVersions: string[];
    results: Record<string, boolean>;
}
export declare class AuraIntegrationTestManager extends EventEmitter {
    private testSuites;
    private performanceBenchmarks;
    private securityScenarios;
    private _compatibilityMatrix;
    private reportsPath;
    private isInitialized;
    private security;
    private ipcManager;
    private processManager;
    private eventBus;
    private tabManager;
    private extensionManager;
    private aiManager;
    private performanceManager;
    private platformManager;
    private devToolsManager;
    private settingsManager;
    constructor(reportsPath: string, security: AuraSecurityFramework, ipcManager: AuraIPCManager, processManager: AuraProcessManager, eventBus: AuraEventBus, tabManager: AuraTabManager, extensionManager: ExtensionManager, aiManager: AIIntegrationManager, performanceManager: PerformanceManager, platformManager: PlatformManager, devToolsManager: DevToolsManager, settingsManager: AuraSettingsManager);
    private initializeDefaultTestSuites;
    private initializePerformanceBenchmarks;
    private initializeSecurityScenarios;
    registerTestSuite(suite: TestSuite): void;
    registerPerformanceBenchmark(benchmark: PerformanceBenchmark): void;
    registerSecurityScenario(scenario: SecurityTestScenario): void;
    runTestSuite(suiteId: string): Promise<TestReport>;
    private runTestCase;
    runPerformanceBenchmarks(): Promise<Record<string, any>>;
    runSecurityTests(): Promise<Record<string, any>>;
    runFullIntegrationTest(): Promise<TestReport[]>;
    private generateTestReport;
    private generateComprehensiveReport;
    private saveTestReport;
    private saveComprehensiveReport;
    private testProcessIPCCommunication;
    private testEventSystemPropagation;
    private testSecurityFrameworkIntegration;
    private testTabManagementLifecycle;
    private testContentExtractionAPIs;
    private testBrowserAutomationAPIs;
    private testAIEventSystem;
    private testMemoryManagementEfficiency;
    private testConcurrentTabHandling;
    private testExtensionLoadingPerformance;
    private testPlatformDetectionAccuracy;
    private testNativeIntegrationConsistency;
    private testUserSessionLifecycle;
    private testAIAssistedBrowsing;
    getTestSuites(): TestSuite[];
    getPerformanceBenchmarks(): PerformanceBenchmark[];
    getSecurityScenarios(): SecurityTestScenario[];
    generateDocumentation(): Promise<void>;
}
//# sourceMappingURL=integration-test-manager.d.ts.map