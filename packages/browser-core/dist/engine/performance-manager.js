"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceManager = void 0;
const events_1 = require("events");
class PerformanceManager extends events_1.EventEmitter {
    constructor(processManager) {
        super();
        this.memoryPools = new Map();
        this.performanceHistory = [];
        this.activeAlerts = new Map();
        this.optimizationStrategies = new Map();
        this.monitoringInterval = null;
        this.gcInterval = null;
        this.processManager = processManager;
        this.renderOptimization = {
            enableHardwareAcceleration: true,
            useCompositing: true,
            enableLazyLoading: true,
            imageCompressionLevel: 80,
            animationFrameRate: 60,
            viewportCulling: true,
            textureCompression: true
        };
        this.initializeMemoryPools();
        this.initializeOptimizationStrategies();
        this.startPerformanceMonitoring();
        this.startGarbageCollection();
    }
    /**
     * Allocate memory from pool
     */
    async allocateMemory(poolId, size, type, owner) {
        try {
            const pool = this.memoryPools.get(poolId);
            if (!pool) {
                throw new Error(`Memory pool ${poolId} not found`);
            }
            if (pool.available < size) {
                await this.optimizeMemoryUsage();
                if (pool.available < size) {
                    throw new Error(`Insufficient memory in pool ${poolId}`);
                }
            }
            const allocationId = `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const allocation = {
                id: allocationId,
                size,
                type,
                owner,
                allocatedAt: new Date(),
                lastAccessed: new Date(),
                references: 1
            };
            pool.allocations.push(allocation);
            pool.used += size;
            pool.available -= size;
            this.emit('memoryAllocated', { poolId, allocation });
            return allocationId;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Memory allocation failed: ${error}`);
        }
    }
    /**
     * Deallocate memory
     */
    async deallocateMemory(poolId, allocationId) {
        try {
            const pool = this.memoryPools.get(poolId);
            if (!pool) {
                throw new Error(`Memory pool ${poolId} not found`);
            }
            const allocationIndex = pool.allocations.findIndex(a => a.id === allocationId);
            if (allocationIndex === -1) {
                throw new Error(`Allocation ${allocationId} not found`);
            }
            const allocation = pool.allocations[allocationIndex];
            pool.used -= allocation.size;
            pool.available += allocation.size;
            pool.allocations.splice(allocationIndex, 1);
            this.emit('memoryDeallocated', { poolId, allocationId });
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Memory deallocation failed: ${error}`);
        }
    }
    /**
     * Get current performance metrics
     */
    async getPerformanceMetrics() {
        try {
            const metrics = {
                timestamp: new Date(),
                memoryUsage: await this.getMemoryUsage(),
                memoryLimit: await this.getMemoryLimit(),
                cpuUsage: await this.getCPUUsage(),
                gpuUsage: await this.getGPUUsage(),
                networkLatency: await this.getNetworkLatency(),
                renderTime: await this.getRenderTime(),
                frameRate: await this.getFrameRate(),
                garbageCollectionTime: await this.getGCTime(),
                activeConnections: await this.getActiveConnections()
            };
            this.performanceHistory.push(metrics);
            // Keep only last 1000 metrics
            if (this.performanceHistory.length > 1000) {
                this.performanceHistory.shift();
            }
            this.checkPerformanceThresholds(metrics);
            this.emit('metricsUpdated', metrics);
            return metrics;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Failed to get performance metrics: ${error}`);
        }
    }
    /**
     * Optimize memory usage
     */
    async optimizeMemoryUsage() {
        try {
            // Run garbage collection
            await this.performGarbageCollection();
            // Identify and clean up unused allocations
            await this.cleanupUnusedAllocations();
            // Compress memory pools
            await this.compressMemoryPools();
            // Apply optimization strategies
            await this.applyOptimizationStrategies();
            this.emit('memoryOptimized');
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Memory optimization failed: ${error}`);
        }
    }
    /**
     * Optimize rendering performance
     */
    async optimizeRendering(options) {
        try {
            this.renderOptimization = { ...this.renderOptimization, ...options };
            // Apply hardware acceleration settings
            if (this.renderOptimization.enableHardwareAcceleration) {
                await this.enableHardwareAcceleration();
            }
            // Configure compositing
            if (this.renderOptimization.useCompositing) {
                await this.configureCompositing();
            }
            // Set up lazy loading
            if (this.renderOptimization.enableLazyLoading) {
                await this.enableLazyLoading();
            }
            // Adjust image compression
            await this.setImageCompression(this.renderOptimization.imageCompressionLevel);
            // Set animation frame rate
            await this.setAnimationFrameRate(this.renderOptimization.animationFrameRate);
            this.emit('renderingOptimized', this.renderOptimization);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Rendering optimization failed: ${error}`);
        }
    }
    /**
     * Create performance alert
     */
    createAlert(type, severity, message, value, threshold) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity,
            message,
            value,
            threshold,
            timestamp: new Date()
        };
        this.activeAlerts.set(alert.id, alert);
        this.emit('alertCreated', alert);
        // Auto-resolve critical alerts
        if (severity === 'critical') {
            this.resolveAlert(alert.id).catch(error => {
                console.error('Auto-resolve failed:', error);
            });
        }
    }
    /**
     * Resolve performance alert
     */
    async resolveAlert(alertId) {
        try {
            const alert = this.activeAlerts.get(alertId);
            if (!alert) {
                throw new Error(`Alert ${alertId} not found`);
            }
            // Apply resolution strategy based on alert type
            switch (alert.type) {
                case 'memory':
                    await this.optimizeMemoryUsage();
                    break;
                case 'cpu':
                    await this.optimizeCPUUsage();
                    break;
                case 'gpu':
                    await this.optimizeGPUUsage();
                    break;
                case 'render':
                    await this.optimizeRendering({});
                    break;
                case 'network':
                    await this.optimizeNetworkUsage();
                    break;
            }
            this.activeAlerts.delete(alertId);
            this.emit('alertResolved', alert);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Alert resolution failed: ${error}`);
        }
    }
    /**
     * Get performance history
     */
    getPerformanceHistory(limit = 100) {
        return this.performanceHistory.slice(-limit);
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    // Private methods
    initializeMemoryPools() {
        // Create default memory pools
        const pools = [
            { id: 'general', size: 100 * 1024 * 1024 }, // 100MB
            { id: 'render', size: 200 * 1024 * 1024 }, // 200MB
            { id: 'script', size: 50 * 1024 * 1024 }, // 50MB
            { id: 'network', size: 25 * 1024 * 1024 } // 25MB
        ];
        for (const poolConfig of pools) {
            const pool = {
                id: poolConfig.id,
                size: poolConfig.size,
                used: 0,
                available: poolConfig.size,
                allocations: [],
                lastGC: new Date()
            };
            this.memoryPools.set(pool.id, pool);
        }
    }
    initializeOptimizationStrategies() {
        // Memory optimization strategy
        const memoryStrategy = {
            id: 'memory_optimization',
            name: 'Memory Optimization',
            description: 'Optimize memory usage when usage exceeds 80%',
            type: 'memory',
            isActive: true,
            priority: 1,
            conditions: [
                { metric: 'memoryUsage', operator: '>', threshold: 80, duration: 5000 }
            ],
            actions: [
                { type: 'gc', target: 'all', parameters: {} },
                { type: 'compress', target: 'pools', parameters: { level: 'aggressive' } }
            ]
        };
        // CPU optimization strategy
        const cpuStrategy = {
            id: 'cpu_optimization',
            name: 'CPU Optimization',
            description: 'Reduce CPU usage when usage exceeds 70%',
            type: 'cpu',
            isActive: true,
            priority: 2,
            conditions: [
                { metric: 'cpuUsage', operator: '>', threshold: 70, duration: 10000 }
            ],
            actions: [
                { type: 'suspend', target: 'background_processes', parameters: {} },
                { type: 'limit_fps', target: 'animations', parameters: { fps: 30 } }
            ]
        };
        this.optimizationStrategies.set(memoryStrategy.id, memoryStrategy);
        this.optimizationStrategies.set(cpuStrategy.id, cpuStrategy);
    }
    startPerformanceMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.getPerformanceMetrics().catch(error => {
                console.error('Performance monitoring error:', error);
            });
        }, 2000); // Monitor every 2 seconds
    }
    startGarbageCollection() {
        this.gcInterval = setInterval(() => {
            this.performGarbageCollection().catch(error => {
                console.error('GC error:', error);
            });
        }, 30000); // GC every 30 seconds
    }
    async performGarbageCollection() {
        const startTime = Date.now();
        // Identify unused allocations (older than 5 minutes)
        const cutoffTime = Date.now() - 5 * 60 * 1000;
        for (const pool of this.memoryPools.values()) {
            const unusedAllocations = pool.allocations.filter(alloc => alloc.lastAccessed.getTime() < cutoffTime && alloc.references === 0);
            for (const allocation of unusedAllocations) {
                await this.deallocateMemory(pool.id, allocation.id);
            }
            pool.lastGC = new Date();
        }
        const gcTime = Date.now() - startTime;
        this.emit('garbageCollected', { duration: gcTime });
    }
    async cleanupUnusedAllocations() {
        // Additional cleanup logic
        this.emit('cleanupCompleted');
    }
    async compressMemoryPools() {
        // Memory pool compression logic
        this.emit('poolsCompressed');
    }
    async applyOptimizationStrategies() {
        const metrics = await this.getPerformanceMetrics();
        for (const strategy of this.optimizationStrategies.values()) {
            if (!strategy.isActive)
                continue;
            const shouldApply = strategy.conditions.every(condition => {
                const value = metrics[condition.metric];
                if (typeof value === 'number') {
                    switch (condition.operator) {
                        case '>': return value > condition.threshold;
                        case '<': return value < condition.threshold;
                        case '>=': return value >= condition.threshold;
                        case '<=': return value <= condition.threshold;
                        case '=': return value === condition.threshold;
                        default: return false;
                    }
                }
                return false; // Skip date fields
            });
            if (shouldApply) {
                await this.executeOptimizationActions(strategy.actions);
            }
        }
    }
    async executeOptimizationActions(actions) {
        for (const action of actions) {
            switch (action.type) {
                case 'gc':
                    await this.performGarbageCollection();
                    break;
                case 'suspend':
                    await this.suspendProcesses(action.target);
                    break;
                case 'reduce_quality':
                    await this.reduceQuality(action.target, action.parameters);
                    break;
                case 'limit_fps':
                    await this.limitFrameRate(action.target, action.parameters.fps);
                    break;
                case 'compress':
                    await this.compressResources(action.target, action.parameters);
                    break;
                case 'unload':
                    await this.unloadResources(action.target);
                    break;
            }
        }
    }
    checkPerformanceThresholds(metrics) {
        // Memory threshold
        if (metrics.memoryUsage > metrics.memoryLimit * 0.9) {
            this.createAlert('memory', 'high', 'Memory usage critical', metrics.memoryUsage, metrics.memoryLimit * 0.9);
        }
        // CPU threshold
        if (metrics.cpuUsage > 80) {
            this.createAlert('cpu', 'medium', 'High CPU usage', metrics.cpuUsage, 80);
        }
        // Frame rate threshold
        if (metrics.frameRate < 30) {
            this.createAlert('render', 'medium', 'Low frame rate', metrics.frameRate, 30);
        }
    }
    // Mock implementations for metrics
    async getMemoryUsage() {
        return Math.random() * 500 * 1024 * 1024; // Mock: 0-500MB
    }
    async getMemoryLimit() {
        return 1024 * 1024 * 1024; // 1GB
    }
    async getCPUUsage() {
        return Math.random() * 100; // Mock: 0-100%
    }
    async getGPUUsage() {
        return Math.random() * 100; // Mock: 0-100%
    }
    async getNetworkLatency() {
        return Math.random() * 100; // Mock: 0-100ms
    }
    async getRenderTime() {
        return Math.random() * 16; // Mock: 0-16ms (60fps)
    }
    async getFrameRate() {
        return 60 - Math.random() * 30; // Mock: 30-60fps
    }
    async getGCTime() {
        return Math.random() * 10; // Mock: 0-10ms
    }
    async getActiveConnections() {
        return Math.floor(Math.random() * 50); // Mock: 0-50 connections
    }
    // Optimization action implementations
    async enableHardwareAcceleration() {
        // Enable GPU acceleration
    }
    async configureCompositing() {
        // Configure compositing layers
    }
    async enableLazyLoading() {
        // Enable lazy loading for images/scripts
    }
    async setImageCompression(_level) {
        // Set image compression level
    }
    async setAnimationFrameRate(_fps) {
        // Set animation frame rate
    }
    async optimizeCPUUsage() {
        // CPU optimization logic
    }
    async optimizeGPUUsage() {
        // GPU optimization logic
    }
    async optimizeNetworkUsage() {
        // Network optimization logic
    }
    async suspendProcesses(_target) {
        // Suspend background processes
    }
    async reduceQuality(_target, _params) {
        // Reduce quality of resources
    }
    async limitFrameRate(_target, _fps) {
        // Limit frame rate
    }
    async compressResources(_target, _params) {
        // Compress resources
    }
    async unloadResources(_target) {
        // Unload unused resources
    }
    destroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
        }
        this.emit('destroyed');
    }
}
exports.PerformanceManager = PerformanceManager;
//# sourceMappingURL=performance-manager.js.map