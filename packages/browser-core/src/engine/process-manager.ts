// Process Manager for Aura Browser
// Handles multi-process architecture, IPC, and resource management

import { EventEmitter } from 'events';
import { Tab, TabStatus } from './chromium-engine';

export interface ProcessInfo {
  id: string;
  type: ProcessType;
  pid?: number;
  memoryUsage: number;
  cpuUsage: number;
  tabs: string[];
  lastActive: Date;
  health: ProcessHealth;
  ipcChannelId?: string; // Store the IPC channel ID for cleanup
}

export enum ProcessType {
  Main = 'main',
  Renderer = 'renderer',
  GPU = 'gpu',
  Network = 'network',
  Utility = 'utility',
  AI = 'ai'
}

export enum ProcessHealth {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Critical = 'critical',
  Dead = 'dead'
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

export enum ChannelType {
  Control = 'control',
  Data = 'data',
  Event = 'event',
  AI = 'ai'
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

export enum SecurityLevel {
  Standard = 'standard',
  Elevated = 'elevated',
  Restricted = 'restricted'
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

// Main Process Manager Implementation
export class AuraProcessManager extends EventEmitter implements ProcessManager {
  private processes: Map<string, ProcessInfo> = new Map();
  private ipcManager: IPCManager;
  private resourceMonitor: ReturnType<typeof setInterval> | null = null;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(ipcManager: IPCManager) {
    super();
    this.ipcManager = ipcManager;
    this.startHealthMonitoring();
    this.startResourceMonitoring();
  }

  async createProcess(type: ProcessType, config: ProcessConfig = {}): Promise<ProcessInfo> {
    const processId = `proc_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const processInfo: ProcessInfo = {
      id: processId,
      type,
      memoryUsage: 0,
      cpuUsage: 0,
      tabs: [],
      lastActive: new Date(),
      health: ProcessHealth.Healthy
    };

    // Create the actual process (this would integrate with native process spawning)
    try {
      await this.spawnNativeProcess(processId, type, config);
      this.processes.set(processId, processInfo);

      // Create IPC channel for this process
      const channel = await this.ipcManager.createChannel(
        `process-${processId}`,
        ChannelType.Control,
        ['main', processId]
      );
      
      // Store the channel ID for later cleanup
      processInfo.ipcChannelId = channel.id;

      this.emit('process-created', processInfo);
      return processInfo;
    } catch (error) {
      throw new Error(`Failed to create process ${type}: ${error}`);
    }
  }

  async destroyProcess(processId: string): Promise<void> {
    const processInfo = this.processes.get(processId);
    if (!processInfo) {
      throw new Error(`Process ${processId} not found`);
    }

    try {
      // Terminate the native process
      await this.terminateNativeProcess(processId);

      // Clean up IPC channels
      if (processInfo.ipcChannelId) {
        await this.ipcManager.destroyChannel(processInfo.ipcChannelId);
      }

      // Remove from tracking
      this.processes.delete(processId);

      this.emit('process-destroyed', processInfo);
    } catch (error) {
      throw new Error(`Failed to destroy process ${processId}: ${error}`);
    }
  }

  async getProcessInfo(processId: string): Promise<ProcessInfo> {
    const processInfo = this.processes.get(processId);
    if (!processInfo) {
      throw new Error(`Process ${processId} not found`);
    }

    // Update with current metrics
    return await this.updateProcessMetrics(processInfo);
  }

  async listProcesses(): Promise<ProcessInfo[]> {
    const processes = Array.from(this.processes.values());

    // Update metrics for all processes
    const updatedProcesses = await Promise.all(
      processes.map(process => this.updateProcessMetrics(process))
    );

    return updatedProcesses;
  }

  async allocateResources(allocation: ResourceAllocation): Promise<void> {
    const processInfo = this.processes.get(allocation.processId);
    if (!processInfo) {
      throw new Error(`Process ${allocation.processId} not found`);
    }

    try {
      // Send resource allocation message via IPC
      await this.ipcManager.sendMessage({
        id: `alloc_${Date.now()}`,
        type: 'resource-allocation',
        from: 'main',
        to: allocation.processId,
        payload: allocation,
        timestamp: new Date()
      });

      this.emit('resources-allocated', allocation);
    } catch (error) {
      throw new Error(`Failed to allocate resources: ${error}`);
    }
  }

  async monitorProcesses(): Promise<void> {
    const processes = Array.from(this.processes.values());

    for (const process of processes) {
      try {
        const updatedProcess = await this.updateProcessMetrics(process);

        // Check health thresholds
        if (updatedProcess.memoryUsage > 500 * 1024 * 1024) { // 500MB
          updatedProcess.health = ProcessHealth.Degraded;
        }

        if (updatedProcess.cpuUsage > 90) {
          updatedProcess.health = ProcessHealth.Critical;
        }

        this.processes.set(process.id, updatedProcess);

        // Emit health change events
        if (updatedProcess.health !== process.health) {
          this.emit('process-health-changed', {
            process: updatedProcess,
            oldHealth: process.health,
            newHealth: updatedProcess.health
          });
        }
      } catch (error) {
        // Mark process as dead if we can't monitor it
        process.health = ProcessHealth.Dead;
        this.emit('process-health-changed', {
          process,
          oldHealth: ProcessHealth.Healthy,
          newHealth: ProcessHealth.Dead
        });
      }
    }
  }

  private async spawnNativeProcess(processId: string, type: ProcessType, _config: ProcessConfig): Promise<void> {
    // This would integrate with native process spawning APIs
    // For now, this is a placeholder that would be implemented with:
    // - Node.js child_process for renderer processes
    // - Native bindings for Chromium processes
    // - Platform-specific process management

    console.log(`Spawning native process: ${processId} (${type})`);
  }

  private async terminateNativeProcess(processId: string): Promise<void> {
    // This would integrate with native process termination APIs
    console.log(`Terminating native process: ${processId}`);
  }

  private async updateProcessMetrics(process: ProcessInfo): Promise<ProcessInfo> {
    // This would query actual process metrics from the OS
    // For now, return mock data
    return {
      ...process,
      memoryUsage: Math.random() * 100 * 1024 * 1024, // Mock memory usage
      cpuUsage: Math.random() * 100, // Mock CPU usage
      lastActive: new Date()
    };
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.monitorProcesses().catch(error => {
        console.error('Health monitoring error:', error);
      });
    }, 5000); // Check every 5 seconds
  }

  private startResourceMonitoring(): void {
    this.resourceMonitor = setInterval(() => {
      this.optimizeResourceAllocation().catch(error => {
        console.error('Resource monitoring error:', error);
      });
    }, 30000); // Check every 30 seconds
  }

  private async optimizeResourceAllocation(): Promise<void> {
    const processes = Array.from(this.processes.values());

    // Simple resource optimization strategy
    for (const process of processes) {
      if (process.memoryUsage > 300 * 1024 * 1024 && process.tabs.length === 0) {
        // Suspend idle processes with high memory usage
        await this.suspendProcess(process.id);
      }
    }
  }

  private async suspendProcess(processId: string): Promise<void> {
    // This would send a suspend message to the process
    await this.ipcManager.sendMessage({
      id: `suspend_${Date.now()}`,
      type: 'suspend',
      from: 'main',
      to: processId,
      payload: {},
      timestamp: new Date()
    });
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.resourceMonitor) {
      clearInterval(this.resourceMonitor);
    }
  }
}

// IPC Manager Implementation
export class AuraIPCManager implements IPCManager {
  private channels: Map<string, IPCChannel> = new Map();
  private subscriptions: Map<string, Map<string, (message: IPCMessage) => void>> = new Map();

  async createChannel(name: string, type: ChannelType, endpoints: string[]): Promise<IPCChannel> {
    const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const channel: IPCChannel = {
      id: channelId,
      name,
      type,
      endpoints,
      isSecure: type === ChannelType.AI // AI channels are always secure
    };

    this.channels.set(channelId, channel);
    this.subscriptions.set(channelId, new Map());

    return channel;
  }

  async destroyChannel(channelId: string): Promise<void> {
    if (!this.channels.has(channelId)) {
      throw new Error(`Channel ${channelId} not found`);
    }

    this.channels.delete(channelId);
    this.subscriptions.delete(channelId);
  }

  async sendMessage(message: IPCMessage): Promise<void> {
    // Find the appropriate channel
    const channel = Array.from(this.channels.values()).find(ch =>
      ch.endpoints.includes(message.from) && ch.endpoints.includes(message.to)
    );

    if (!channel) {
      throw new Error(`No channel found between ${message.from} and ${message.to}`);
    }

    // Route message to appropriate handler
    const channelSubscriptions = this.subscriptions.get(channel.id);
    if (channelSubscriptions) {
      for (const handler of channelSubscriptions.values()) {
        handler(message);
      }
    }

    // If message requires response, wait for it
    if (message.requiresResponse) {
      // This would implement response waiting logic
      // For now, this is a placeholder
    }
  }

  subscribeToChannel(channelId: string, handler: (message: IPCMessage) => void): Subscription {
    if (!this.channels.has(channelId)) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const channelSubscriptions = this.subscriptions.get(channelId)!;
    channelSubscriptions.set(subscriptionId, handler);

    return {
      unsubscribe: () => {
        channelSubscriptions.delete(subscriptionId);
      },
      id: subscriptionId
    };
  }

  async getChannelInfo(channelId: string): Promise<IPCChannel> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    return channel;
  }
}

// Factory functions
export function createProcessManager(ipcManager: IPCManager): ProcessManager {
  return new AuraProcessManager(ipcManager);
}

export function createIPCManager(): IPCManager {
  return new AuraIPCManager();
}
