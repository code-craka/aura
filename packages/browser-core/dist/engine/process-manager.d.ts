import { EventEmitter } from 'events';
export interface ProcessInfo {
    id: string;
    type: ProcessType;
    pid?: number;
    memoryUsage: number;
    cpuUsage: number;
    tabs: string[];
    lastActive: Date;
    health: ProcessHealth;
}
export declare enum ProcessType {
    Main = "main",
    Renderer = "renderer",
    GPU = "gpu",
    Network = "network",
    Utility = "utility",
    AI = "ai"
}
export declare enum ProcessHealth {
    Healthy = "healthy",
    Degraded = "degraded",
    Critical = "critical",
    Dead = "dead"
}
export interface IPCMessage {
    id: string;
    type: string;
    from: string;
    to: string;
    payload: any;
    timestamp: Date;
    requiresResponse?: boolean;
}
export interface IPCChannel {
    id: string;
    name: string;
    type: ChannelType;
    endpoints: string[];
    isSecure: boolean;
}
export declare enum ChannelType {
    Control = "control",
    Data = "data",
    Event = "event",
    AI = "ai"
}
export interface ResourceAllocation {
    processId: string;
    memoryLimit: number;
    cpuQuota: number;
    networkPriority: number;
    gpuMemory?: number;
}
export interface ProcessManager {
    createProcess(type: ProcessType, config?: ProcessConfig): Promise<ProcessInfo>;
    destroyProcess(processId: string): Promise<void>;
    getProcessInfo(processId: string): Promise<ProcessInfo>;
    listProcesses(): Promise<ProcessInfo[]>;
    allocateResources(allocation: ResourceAllocation): Promise<void>;
    monitorProcesses(): Promise<void>;
}
export interface ProcessConfig {
    memoryLimit?: number;
    cpuQuota?: number;
    networkPriority?: number;
    gpuMemory?: number;
    securityLevel?: SecurityLevel;
    aiEnabled?: boolean;
}
export declare enum SecurityLevel {
    Standard = "standard",
    Elevated = "elevated",
    Restricted = "restricted"
}
export interface IPCManager {
    createChannel(name: string, type: ChannelType, endpoints: string[]): Promise<IPCChannel>;
    destroyChannel(channelId: string): Promise<void>;
    sendMessage(message: IPCMessage): Promise<void>;
    subscribeToChannel(channelId: string, handler: (message: IPCMessage) => void): Subscription;
    getChannelInfo(channelId: string): Promise<IPCChannel>;
}
export type Subscription = {
    unsubscribe(): void;
    id: string;
};
export declare class AuraProcessManager extends EventEmitter implements ProcessManager {
    private processes;
    private ipcManager;
    private resourceMonitor;
    private healthCheckInterval;
    constructor(ipcManager: IPCManager);
    createProcess(type: ProcessType, config?: ProcessConfig): Promise<ProcessInfo>;
    destroyProcess(processId: string): Promise<void>;
    getProcessInfo(processId: string): Promise<ProcessInfo>;
    listProcesses(): Promise<ProcessInfo[]>;
    allocateResources(allocation: ResourceAllocation): Promise<void>;
    monitorProcesses(): Promise<void>;
    private spawnNativeProcess;
    private terminateNativeProcess;
    private updateProcessMetrics;
    private startHealthMonitoring;
    private startResourceMonitoring;
    private optimizeResourceAllocation;
    private suspendProcess;
    destroy(): void;
}
export declare class AuraIPCManager implements IPCManager {
    private channels;
    private subscriptions;
    createChannel(name: string, type: ChannelType, endpoints: string[]): Promise<IPCChannel>;
    destroyChannel(channelId: string): Promise<void>;
    sendMessage(message: IPCMessage): Promise<void>;
    subscribeToChannel(channelId: string, handler: (message: IPCMessage) => void): Subscription;
    getChannelInfo(channelId: string): Promise<IPCChannel>;
}
export declare function createProcessManager(ipcManager: IPCManager): ProcessManager;
export declare function createIPCManager(): IPCManager;
//# sourceMappingURL=process-manager.d.ts.map