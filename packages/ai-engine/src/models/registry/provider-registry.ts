/**
 * AI Provider Registry
 * 
 * Central registry for managing AI providers, their capabilities, and routing decisions.
 * Handles provider registration, discovery, health monitoring, and intelligent selection.
 */

import { EventEmitter } from 'events';
import {
  AIProvider,
  ProviderRegistration,
  ModelCapability,
  CapabilityType,
  ProviderStatus,
  QueryOptions
} from '../interfaces/ai-provider.js';

export interface ProviderSelectionCriteria {
  requiredCapabilities: CapabilityType[];
  maxLatency?: number;
  maxCost?: number;
  preferredProviders?: string[];
  excludeProviders?: string[];
  requiresStreaming?: boolean;
  priority?: 'speed' | 'quality' | 'cost' | 'availability';
}

export interface ProviderScore {
  providerId: string;
  score: number;
  factors: {
    capability: number;
    availability: number;
    performance: number;
    cost: number;
    priority: number;
  };
  reasoning: string;
}

export interface RegistryEvents {
  'provider-registered': (registration: ProviderRegistration) => void;
  'provider-unregistered': (providerId: string) => void;
  'provider-status-changed': (providerId: string, status: ProviderStatus) => void;
  'provider-selection': (criteria: ProviderSelectionCriteria, selected: string[]) => void;
}

/**
 * Provider Registry manages all AI providers and handles intelligent routing
 */
export class ProviderRegistry extends EventEmitter {
  private providers = new Map<string, ProviderRegistration>();
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly healthCheckIntervalMs = 30000; // 30 seconds
  private selectionHistory = new Map<string, { count: number; lastUsed: Date }>();

  constructor() {
    super();
    this.startHealthMonitoring();
  }

  /**
   * Register a new AI provider
   */
  async registerProvider(
    provider: AIProvider,
    options: {
      priority?: number;
      enabled?: boolean;
      fallbackFor?: string[];
      tags?: string[];
    } = {}
  ): Promise<void> {
    const registration: ProviderRegistration = {
      provider,
      priority: options.priority ?? 50,
      enabled: options.enabled ?? true,
      fallbackFor: options.fallbackFor ?? [],
      tags: options.tags ?? []
    };

    // Validate provider before registration
    const validation = await provider.validateConfig();
    if (!validation.valid) {
      throw new Error(`Provider validation failed: ${validation.errors?.join(', ')}`);
    }

    // Test authentication
    const authSuccess = await provider.authenticate();
    if (!authSuccess) {
      throw new Error(`Provider authentication failed: ${provider.name}`);
    }

    this.providers.set(provider.name, registration);
    
    // Set up status monitoring for this provider
    // TODO: Event handling will be implemented in Phase 2
    // provider.on('status-change', (status) => {
    //   this.emit('provider-status-changed', provider.name, status);
    // });

    // this.emit('provider-registered', registration);
  }

  /**
   * Unregister a provider
   */
  async unregisterProvider(providerId: string): Promise<void> {
    const registration = this.providers.get(providerId);
    if (!registration) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    await registration.provider.dispose();
    this.providers.delete(providerId);
    this.selectionHistory.delete(providerId);
    
    // this.emit('provider-unregistered', providerId);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ProviderRegistration[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders(): ProviderRegistration[] {
    return this.getAllProviders().filter(reg => reg.enabled);
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId)?.provider;
  }

  /**
   * Select best provider for given criteria
   */
  async selectProvider(criteria: ProviderSelectionCriteria): Promise<AIProvider | null> {
    const scores = await this.scoreProviders(criteria);
    
    if (scores.length === 0) {
      return null;
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    const selectedProviderId = scores[0].providerId;
    const selectedProvider = this.getProvider(selectedProviderId);

    if (selectedProvider) {
      // Update selection history
      const history = this.selectionHistory.get(selectedProviderId) ?? { count: 0, lastUsed: new Date() };
      history.count++;
      history.lastUsed = new Date();
      this.selectionHistory.set(selectedProviderId, history);

      // this.emit('provider-selection', criteria, [selectedProviderId]);
    }

    return selectedProvider ?? null;
  }

  /**
   * Select multiple providers (for fallback or ensemble)
   */
  async selectProviders(
    criteria: ProviderSelectionCriteria,
    count: number = 3
  ): Promise<AIProvider[]> {
    const scores = await this.scoreProviders(criteria);
    
    // Sort by score descending and take top N
    scores.sort((a, b) => b.score - a.score);
    const selectedIds = scores.slice(0, count).map(s => s.providerId);
    
    const providers = selectedIds
      .map(id => this.getProvider(id))
      .filter((p): p is AIProvider => p !== undefined);

    if (providers.length > 0) {
      // this.emit('provider-selection', criteria, selectedIds);
    }

    return providers;
  }

  /**
   * Get fallback providers for a failed provider
   */
  async getFallbackProviders(failedProviderId: string): Promise<AIProvider[]> {
    const enabledProviders = this.getEnabledProviders();
    
    // Find providers that explicitly list this as fallback target
    const explicitFallbacks = enabledProviders.filter(reg => 
      reg.fallbackFor?.includes(failedProviderId)
    );

    if (explicitFallbacks.length > 0) {
      return explicitFallbacks.map(reg => reg.provider);
    }

    // Otherwise, return other available providers with similar capabilities
    const failedProvider = this.getProvider(failedProviderId);
    if (!failedProvider) {
      return [];
    }

    const requiredCapabilities = failedProvider.capabilities.map(cap => cap.type);
    const fallbacks = await this.selectProviders({
      requiredCapabilities,
      excludeProviders: [failedProviderId],
      priority: 'availability'
    });

    return fallbacks;
  }

  /**
   * Score providers based on selection criteria
   */
  private async scoreProviders(criteria: ProviderSelectionCriteria): Promise<ProviderScore[]> {
    const enabledProviders = this.getEnabledProviders();
    const scores: ProviderScore[] = [];

    for (const registration of enabledProviders) {
      const { provider } = registration;

      // Skip excluded providers
      if (criteria.excludeProviders?.includes(provider.name)) {
        continue;
      }

      // Calculate capability score
      const capabilityScore = this.calculateCapabilityScore(
        provider.capabilities,
        criteria.requiredCapabilities
      );

      // Skip if provider doesn't meet capability requirements
      if (capabilityScore === 0) {
        continue;
      }

      // Calculate other scoring factors
      const availabilityScore = await this.calculateAvailabilityScore(provider);
      const performanceScore = await this.calculatePerformanceScore(provider, criteria);
      const costScore = await this.calculateCostScore(provider, criteria);
      const priorityScore = this.calculatePriorityScore(registration, criteria);

      // Weight factors based on priority
      const weights = this.getPriorityWeights(criteria.priority ?? 'quality');
      const totalScore = 
        (capabilityScore * weights.capability) +
        (availabilityScore * weights.availability) +
        (performanceScore * weights.performance) +
        (costScore * weights.cost) +
        (priorityScore * weights.priority);

      scores.push({
        providerId: provider.name,
        score: totalScore,
        factors: {
          capability: capabilityScore,
          availability: availabilityScore,
          performance: performanceScore,
          cost: costScore,
          priority: priorityScore
        },
        reasoning: this.generateScoreReasoning(provider.name, {
          capability: capabilityScore,
          availability: availabilityScore,
          performance: performanceScore,
          cost: costScore,
          priority: priorityScore
        })
      });
    }

    return scores;
  }

  /**
   * Calculate capability match score
   */
  private calculateCapabilityScore(
    providerCapabilities: ModelCapability[],
    requiredCapabilities: CapabilityType[]
  ): number {
    if (requiredCapabilities.length === 0) {
      return 1; // No specific requirements
    }

    const providerTypes = new Set(providerCapabilities.map(cap => cap.type));
    const matchedCapabilities = requiredCapabilities.filter(req => providerTypes.has(req));
    
    return matchedCapabilities.length / requiredCapabilities.length;
  }

  /**
   * Calculate availability score
   */
  private async calculateAvailabilityScore(provider: AIProvider): Promise<number> {
    try {
      const status = await provider.getStatus();
      
      if (!status.isAvailable) {
        return 0;
      }

      // Factor in error rate and rate limiting
      let score = 1;
      
      if (status.errorRate > 0) {
        score *= (1 - Math.min(status.errorRate, 0.5)); // Cap error rate impact at 50%
      }

      if (status.rateLimitRemaining !== undefined && status.rateLimitRemaining < 10) {
        score *= 0.5; // Reduce score if approaching rate limit
      }

      return score;
    } catch (error) {
      return 0; // Provider not available
    }
  }

  /**
   * Calculate performance score
   */
  private async calculatePerformanceScore(
    provider: AIProvider,
    criteria: ProviderSelectionCriteria
  ): Promise<number> {
    try {
      const latency = await provider.getLatency();
      
      if (criteria.maxLatency && latency > criteria.maxLatency) {
        return 0; // Exceeds maximum allowed latency
      }

      // Score based on latency (lower is better)
      const maxReasonableLatency = criteria.maxLatency ?? 5000; // 5 seconds default
      return Math.max(0, 1 - (latency / maxReasonableLatency));
    } catch (error) {
      return 0.5; // Unknown performance, give neutral score
    }
  }

  /**
   * Calculate cost efficiency score
   */
  private async calculateCostScore(
    provider: AIProvider,
    criteria: ProviderSelectionCriteria
  ): Promise<number> {
    try {
      // Use a sample query to estimate cost
      const sampleQuery = "Hello, world!";
      const estimatedCost = await provider.estimateCost(sampleQuery);
      
      if (criteria.maxCost && estimatedCost > criteria.maxCost) {
        return 0; // Exceeds maximum allowed cost
      }

      if (estimatedCost === 0) {
        return 1; // Free is best
      }

      // Score based on cost (lower is better)
      const maxReasonableCost = criteria.maxCost ?? 0.01; // $0.01 default
      return Math.max(0, 1 - (estimatedCost / maxReasonableCost));
    } catch (error) {
      return 0.5; // Unknown cost, give neutral score
    }
  }

  /**
   * Calculate priority score based on configuration and preferences
   */
  private calculatePriorityScore(
    registration: ProviderRegistration,
    criteria: ProviderSelectionCriteria
  ): number {
    let score = registration.priority / 100; // Normalize priority (0-100 -> 0-1)

    // Boost score for preferred providers
    if (criteria.preferredProviders?.includes(registration.provider.name)) {
      score *= 1.5;
    }

    // Boost based on usage history (slight preference for previously successful providers)
    const history = this.selectionHistory.get(registration.provider.name);
    if (history && history.count > 0) {
      score *= 1.1; // Small boost for proven providers
    }

    return Math.min(score, 1); // Cap at 1
  }

  /**
   * Get priority weights based on selection strategy
   */
  private getPriorityWeights(priority: 'speed' | 'quality' | 'cost' | 'availability'): {
    capability: number;
    availability: number;
    performance: number;
    cost: number;
    priority: number;
  } {
    switch (priority) {
      case 'speed':
        return { capability: 0.3, availability: 0.2, performance: 0.4, cost: 0.05, priority: 0.05 };
      case 'quality':
        return { capability: 0.4, availability: 0.2, performance: 0.2, cost: 0.1, priority: 0.1 };
      case 'cost':
        return { capability: 0.3, availability: 0.2, performance: 0.1, cost: 0.35, priority: 0.05 };
      case 'availability':
        return { capability: 0.2, availability: 0.5, performance: 0.1, cost: 0.1, priority: 0.1 };
      default:
        return { capability: 0.3, availability: 0.25, performance: 0.2, cost: 0.15, priority: 0.1 };
    }
  }

  /**
   * Generate human-readable scoring reasoning
   */
  private generateScoreReasoning(providerId: string, factors: {
    capability: number;
    availability: number;
    performance: number;
    cost: number;
    priority: number;
  }): string {
    const reasons: string[] = [];

    if (factors.capability > 0.8) {
      reasons.push('excellent capability match');
    } else if (factors.capability > 0.6) {
      reasons.push('good capability match');
    } else if (factors.capability > 0.3) {
      reasons.push('partial capability match');
    }

    if (factors.availability > 0.9) {
      reasons.push('highly available');
    } else if (factors.availability > 0.7) {
      reasons.push('available');
    } else if (factors.availability < 0.5) {
      reasons.push('limited availability');
    }

    if (factors.performance > 0.8) {
      reasons.push('excellent performance');
    } else if (factors.performance > 0.6) {
      reasons.push('good performance');
    }

    if (factors.cost > 0.8) {
      reasons.push('cost-effective');
    } else if (factors.cost < 0.3) {
      reasons.push('expensive');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'standard scoring';
  }

  /**
   * Start health monitoring for all providers
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      for (const [providerId, registration] of this.providers) {
        try {
          const status = await registration.provider.getStatus();
          // this.emit('provider-status-changed', providerId, status);
        } catch (error) {
          // Health check failed, provider might be down
          const errorStatus: ProviderStatus = {
            isAvailable: false,
            lastChecked: new Date(),
            latency: 0,
            errorRate: 1
          };
          // this.emit('provider-status-changed', providerId, errorStatus);
        }
      }
    }, this.healthCheckIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Get provider selection statistics
   */
  getSelectionStats(): Map<string, { count: number; lastUsed: Date }> {
    return new Map(this.selectionHistory);
  }

  /**
   * Reset selection statistics
   */
  resetSelectionStats(): void {
    this.selectionHistory.clear();
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.stopHealthMonitoring();
    
    // Dispose all providers
    for (const registration of this.providers.values()) {
      await registration.provider.dispose();
    }
    
    this.providers.clear();
    this.selectionHistory.clear();
    this.removeAllListeners();
  }
}