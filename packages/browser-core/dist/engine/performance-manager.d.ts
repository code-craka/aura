import { EventEmitter } from 'events';
import { AuraProcessManager } from './process-manager';
/**
 * PerformanceManager - Performance Optimization System for Aura Browser
 *
 * Provides comprehensive performance optimization including:
 * - Memory management and pooling
 * - Rendering and UI optimization
 * - Resource monitoring and alerting
 * - Adaptive performance based on system resources
 */
export interface MemoryPool {
    id: string;
    size: number;
    used: number;
    available: number;
    allocations: MemoryAllocation[];
    lastGC: Date;
}
export interface MemoryAllocation {
    id: string;
    size: number;
    type: 'buffer' | 'object' | 'texture' | 'script';
    owner: string;
    allocatedAt: Date;
    lastAccessed: Date;
    references: number;
}
export interface PerformanceMetrics {
    timestamp: Date;
    memoryUsage: number;
    memoryLimit: number;
    cpuUsage: number;
    gpuUsage: number;
    networkLatency: number;
    renderTime: number;
    frameRate: number;
    garbageCollectionTime: number;
    activeConnections: number;
}
export interface ResourceAlert {
    id: string;
    type: 'memory' | 'cpu' | 'gpu' | 'network' | 'render';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    value: number;
    threshold: number;
    timestamp: Date;
}
export interface OptimizationStrategy {
    id: string;
    name: string;
    description: string;
    type: 'memory' | 'cpu' | 'render' | 'network';
    isActive: boolean;
    priority: number;
    conditions: OptimizationCondition[];
    actions: OptimizationAction[];
}
export interface OptimizationCondition {
    metric: keyof PerformanceMetrics;
    operator: '>' | '<' | '>=' | '<=' | '=';
    threshold: number;
    duration: number;
}
export interface OptimizationAction {
    type: 'gc' | 'suspend' | 'reduce_quality' | 'limit_fps' | 'compress' | 'unload';
    target: string;
    parameters: any;
}
export interface RenderOptimization {
    enableHardwareAcceleration: boolean;
    useCompositing: boolean;
    enableLazyLoading: boolean;
    imageCompressionLevel: number;
    animationFrameRate: number;
    viewportCulling: boolean;
    textureCompression: boolean;
}
export declare class PerformanceManager extends EventEmitter {
    private processManager;
    private memoryPools;
    private performanceHistory;
    private activeAlerts;
    private optimizationStrategies;
    private renderOptimization;
    private monitoringInterval;
    private gcInterval;
    constructor(processManager: AuraProcessManager);
    /**
     * Allocate memory from pool
     */
    allocateMemory(poolId: string, size: number, type: MemoryAllocation['type'], owner: string): Promise<string>;
    /**
     * Deallocate memory
     */
    deallocateMemory(poolId: string, allocationId: string): Promise<void>;
    /**
     * Get current performance metrics
     */
    getPerformanceMetrics(): Promise<PerformanceMetrics>;
    /**
     * Optimize memory usage
     */
    optimizeMemoryUsage(): Promise<void>;
    /**
     * Optimize rendering performance
     */
    optimizeRendering(options: Partial<RenderOptimization>): Promise<void>;
    /**
     * Create performance alert
     */
    createAlert(type: ResourceAlert['type'], severity: ResourceAlert['severity'], message: string, value: number, threshold: number): void;
    /**
     * Resolve performance alert
     */
    resolveAlert(alertId: string): Promise<void>;
    /**
     * Get performance history
     */
    getPerformanceHistory(limit?: number): PerformanceMetrics[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): ResourceAlert[];
    private initializeMemoryPools;
    private initializeOptimizationStrategies;
    private startPerformanceMonitoring;
    private startGarbageCollection;
    private performGarbageCollection;
    private cleanupUnusedAllocations;
    private compressMemoryPools;
    private applyOptimizationStrategies;
    private executeOptimizationActions;
    private checkPerformanceThresholds;
    private getMemoryUsage;
    private getMemoryLimit;
    private getCPUUsage;
    private getGPUUsage;
    private getNetworkLatency;
    private getRenderTime;
    private getFrameRate;
    private getGCTime;
    private getActiveConnections;
    private enableHardwareAcceleration;
    private configureCompositing;
    private enableLazyLoading;
    private setImageCompression;
    private setAnimationFrameRate;
    private optimizeCPUUsage;
    private optimizeGPUUsage;
    private optimizeNetworkUsage;
    private suspendProcesses;
    private reduceQuality;
    private limitFrameRate;
    private compressResources;
    private unloadResources;
    destroy(): void;
}
//# sourceMappingURL=performance-manager.d.ts.map