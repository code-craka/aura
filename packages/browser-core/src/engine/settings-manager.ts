import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { AuraSecurityFramework } from './security/security-framework';
import { AuraIPCManager } from './process-manager';
import { AuraEventBus } from './event-system';

export interface SettingDefinition {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue: any;
  description: string;
  category: string;
  validation?: (value: any) => boolean;
  requiresRestart?: boolean;
  dependencies?: string[];
  migration?: (oldValue: any, newVersion: string) => any;
}

export interface SettingsGroup {
  name: string;
  description: string;
  settings: SettingDefinition[];
  parent?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  preferences: Map<string, any>;
  createdAt: Date;
  lastModified: Date;
  version: string;
}

export interface ThemeDefinition {
  name: string;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    error: string;
    warning: string;
    success: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  animations: {
    duration: string;
    easing: string;
  };
}

export interface LayoutPreset {
  name: string;
  displayName: string;
  description: string;
  layout: {
    toolbar: {
      position: 'top' | 'bottom' | 'left' | 'right';
      height?: string;
      width?: string;
    };
    sidebar: {
      position: 'left' | 'right';
      width: string;
      collapsed: boolean;
    };
    tabs: {
      position: 'top' | 'bottom';
      height: string;
      showCloseButton: boolean;
      showNewTabButton: boolean;
    };
    statusBar: {
      position: 'bottom';
      height: string;
      visible: boolean;
    };
  };
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  colorScheme: 'light' | 'dark' | 'auto';
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  zoomLevel: number;
}

export class AuraSettingsManager extends EventEmitter {
  private settings: Map<string, any> = new Map();
  private settingsGroups: Map<string, SettingsGroup> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private themes: Map<string, ThemeDefinition> = new Map();
  private layoutPresets: Map<string, LayoutPreset> = new Map();
  private currentProfile: string | null = null;
  private settingsPath: string;
  private profilesPath: string;
  private themesPath: string;
  private security: AuraSecurityFramework;
  private ipcManager: AuraIPCManager;
  private eventSystem: AuraEventBus;
  private isInitialized: boolean = false;

  constructor(
    settingsPath: string,
    security: AuraSecurityFramework,
    ipcManager: AuraIPCManager,
    eventSystem: AuraEventBus
  ) {
    super();
    this.settingsPath = settingsPath;
    this.profilesPath = path.join(path.dirname(settingsPath), 'profiles');
    this.themesPath = path.join(path.dirname(settingsPath), 'themes');
    this.security = security;
    this.ipcManager = ipcManager;
    this.eventSystem = eventSystem;

    this.initializeDefaultSettings();
    this.initializeDefaultThemes();
    this.initializeDefaultLayouts();
  }

  private initializeDefaultSettings(): void {
    // Browser Core Settings
    this.registerSettingsGroup({
      name: 'browser',
      description: 'Core browser settings',
      settings: [
        {
          key: 'homepage',
          type: 'string',
          defaultValue: 'https://www.google.com',
          description: 'Default homepage URL',
          category: 'general',
          validation: (value: string) => {
            try {
              new URL(value);
              return true;
            } catch {
              return false;
            }
          }
        },
        {
          key: 'newTabPage',
          type: 'string',
          defaultValue: 'default',
          description: 'New tab page type',
          category: 'general'
        },
        {
          key: 'searchEngine',
          type: 'string',
          defaultValue: 'google',
          description: 'Default search engine',
          category: 'search'
        },
        {
          key: 'javascript',
          type: 'boolean',
          defaultValue: true,
          description: 'Enable JavaScript',
          category: 'content',
          requiresRestart: true
        },
        {
          key: 'images',
          type: 'boolean',
          defaultValue: true,
          description: 'Load images automatically',
          category: 'content'
        },
        {
          key: 'cookies',
          type: 'boolean',
          defaultValue: true,
          description: 'Accept cookies',
          category: 'privacy'
        },
        {
          key: 'popupBlocker',
          type: 'boolean',
          defaultValue: true,
          description: 'Block pop-up windows',
          category: 'privacy'
        }
      ]
    });

    // Performance Settings
    this.registerSettingsGroup({
      name: 'performance',
      description: 'Performance and optimization settings',
      settings: [
        {
          key: 'hardwareAcceleration',
          type: 'boolean',
          defaultValue: true,
          description: 'Enable hardware acceleration',
          category: 'rendering',
          requiresRestart: true
        },
        {
          key: 'memoryLimit',
          type: 'number',
          defaultValue: 1024,
          description: 'Memory limit per tab (MB)',
          category: 'memory',
          validation: (value: number) => value >= 256 && value <= 4096
        },
        {
          key: 'tabSuspension',
          type: 'boolean',
          defaultValue: true,
          description: 'Suspend inactive tabs',
          category: 'memory'
        },
        {
          key: 'preloading',
          type: 'boolean',
          defaultValue: true,
          description: 'Preload pages for faster navigation',
          category: 'network'
        }
      ]
    });

    // Security Settings
    this.registerSettingsGroup({
      name: 'security',
      description: 'Security and privacy settings',
      settings: [
        {
          key: 'safeBrowsing',
          type: 'boolean',
          defaultValue: true,
          description: 'Enable safe browsing protection',
          category: 'protection'
        },
        {
          key: 'phishingProtection',
          type: 'boolean',
          defaultValue: true,
          description: 'Enable phishing protection',
          category: 'protection'
        },
        {
          key: 'certificateValidation',
          type: 'boolean',
          defaultValue: true,
          description: 'Validate SSL certificates',
          category: 'security'
        },
        {
          key: 'mixedContent',
          type: 'string',
          defaultValue: 'block',
          description: 'Mixed content handling',
          category: 'security',
          validation: (value: string) => ['allow', 'block', 'warn'].includes(value)
        }
      ]
    });

    // Accessibility Settings
    this.registerSettingsGroup({
      name: 'accessibility',
      description: 'Accessibility settings',
      settings: [
        {
          key: 'highContrast',
          type: 'boolean',
          defaultValue: false,
          description: 'Enable high contrast mode',
          category: 'visual'
        },
        {
          key: 'reducedMotion',
          type: 'boolean',
          defaultValue: false,
          description: 'Reduce animations and motion',
          category: 'motion'
        },
        {
          key: 'fontSize',
          type: 'string',
          defaultValue: 'medium',
          description: 'Default font size',
          category: 'text',
          validation: (value: string) => ['small', 'medium', 'large', 'xlarge'].includes(value)
        },
        {
          key: 'colorScheme',
          type: 'string',
          defaultValue: 'auto',
          description: 'Color scheme preference',
          category: 'visual',
          validation: (value: string) => ['light', 'dark', 'auto'].includes(value)
        }
      ]
    });
  }

  private initializeDefaultThemes(): void {
    // Light Theme
    this.registerTheme({
      name: 'light',
      displayName: 'Light',
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#212121',
        textSecondary: '#757575',
        accent: '#ff4081',
        error: '#d32f2f',
        warning: '#f57c00',
        success: '#388e3c',
        border: '#e0e0e0'
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: {
          small: '0.875rem',
          medium: '1rem',
          large: '1.25rem',
          xlarge: '1.5rem'
        }
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px',
        xlarge: '32px'
      },
      borderRadius: {
        small: '4px',
        medium: '8px',
        large: '12px'
      },
      shadows: {
        small: '0 1px 3px rgba(0,0,0,0.12)',
        medium: '0 4px 6px rgba(0,0,0,0.16)',
        large: '0 10px 25px rgba(0,0,0,0.19)'
      },
      animations: {
        duration: '200ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    });

    // Dark Theme
    this.registerTheme({
      name: 'dark',
      displayName: 'Dark',
      colors: {
        primary: '#2196f3',
        secondary: '#e91e63',
        background: '#121212',
        surface: '#1e1e1e',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        accent: '#ff4081',
        error: '#f44336',
        warning: '#ff9800',
        success: '#4caf50',
        border: '#333333'
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: {
          small: '0.875rem',
          medium: '1rem',
          large: '1.25rem',
          xlarge: '1.5rem'
        }
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px',
        xlarge: '32px'
      },
      borderRadius: {
        small: '4px',
        medium: '8px',
        large: '12px'
      },
      shadows: {
        small: '0 1px 3px rgba(0,0,0,0.4)',
        medium: '0 4px 6px rgba(0,0,0,0.5)',
        large: '0 10px 25px rgba(0,0,0,0.6)'
      },
      animations: {
        duration: '200ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    });
  }

  private initializeDefaultLayouts(): void {
    // Default Layout
    this.registerLayoutPreset({
      name: 'default',
      displayName: 'Default',
      description: 'Standard browser layout',
      layout: {
        toolbar: {
          position: 'top',
          height: '48px'
        },
        sidebar: {
          position: 'left',
          width: '240px',
          collapsed: false
        },
        tabs: {
          position: 'top',
          height: '40px',
          showCloseButton: true,
          showNewTabButton: true
        },
        statusBar: {
          position: 'bottom',
          height: '24px',
          visible: true
        }
      }
    });

    // Compact Layout
    this.registerLayoutPreset({
      name: 'compact',
      displayName: 'Compact',
      description: 'Space-efficient layout',
      layout: {
        toolbar: {
          position: 'top',
          height: '36px'
        },
        sidebar: {
          position: 'left',
          width: '200px',
          collapsed: true
        },
        tabs: {
          position: 'top',
          height: '32px',
          showCloseButton: true,
          showNewTabButton: false
        },
        statusBar: {
          position: 'bottom',
          height: '20px',
          visible: false
        }
      }
    });
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure directories exist
      await fs.promises.mkdir(path.dirname(this.settingsPath), { recursive: true });
      await fs.promises.mkdir(this.profilesPath, { recursive: true });
      await fs.promises.mkdir(this.themesPath, { recursive: true });

      // Load settings
      await this.loadSettings();

      // Load user profiles
      await this.loadUserProfiles();

      // Load custom themes
      await this.loadCustomThemes();

      this.isInitialized = true;
      this.emit('initialized');

      // Broadcast initialization event
      this.eventSystem.emit('settings:initialized', {
        timestamp: new Date(),
        profileCount: this.userProfiles.size,
        themeCount: this.themes.size
      });

    } catch (error) {
      console.error('Failed to initialize settings manager:', error);
      throw error;
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = await fs.promises.readFile(this.settingsPath, 'utf-8');
        const settings = JSON.parse(data);

        // Validate and migrate settings
        for (const [key, value] of Object.entries(settings)) {
          const definition = this.getSettingDefinition(key);
          if (definition) {
            const migratedValue = this.migrateSetting(key, value, settings.version || '1.0.0');
            if (this.validateSetting(key, migratedValue)) {
              this.settings.set(key, migratedValue);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
    }
  }

  private async loadUserProfiles(): Promise<void> {
    try {
      const profileFiles = await fs.promises.readdir(this.profilesPath);
      for (const file of profileFiles) {
        if (file.endsWith('.json')) {
          const profilePath = path.join(this.profilesPath, file);
          const data = await fs.promises.readFile(profilePath, 'utf-8');
          const profile: UserProfile = JSON.parse(data);
          this.userProfiles.set(profile.id, profile);
        }
      }
    } catch (error) {
      console.warn('Failed to load user profiles:', error);
    }
  }

  private async loadCustomThemes(): Promise<void> {
    try {
      const themeFiles = await fs.promises.readdir(this.themesPath);
      for (const file of themeFiles) {
        if (file.endsWith('.json')) {
          const themePath = path.join(this.themesPath, file);
          const data = await fs.promises.readFile(themePath, 'utf-8');
          const theme: ThemeDefinition = JSON.parse(data);
          this.themes.set(theme.name, theme);
        }
      }
    } catch (error) {
      console.warn('Failed to load custom themes:', error);
    }
  }

  public registerSettingsGroup(group: SettingsGroup): void {
    this.settingsGroups.set(group.name, group);

    // Initialize default values
    for (const setting of group.settings) {
      if (!this.settings.has(setting.key)) {
        this.settings.set(setting.key, setting.defaultValue);
      }
    }

    this.emit('settingsGroupRegistered', group);
  }

  public registerTheme(theme: ThemeDefinition): void {
    this.themes.set(theme.name, theme);
    this.emit('themeRegistered', theme);
  }

  public registerLayoutPreset(layout: LayoutPreset): void {
    this.layoutPresets.set(layout.name, layout);
    this.emit('layoutPresetRegistered', layout);
  }

  public getSetting(key: string): any {
    return this.settings.get(key);
  }

  public async setSetting(key: string, value: any): Promise<void> {
    const definition = this.getSettingDefinition(key);
    if (!definition) {
      throw new Error(`Unknown setting: ${key}`);
    }

    if (!this.validateSetting(key, value)) {
      throw new Error(`Invalid value for setting ${key}`);
    }

    const oldValue = this.settings.get(key);
    this.settings.set(key, value);

    // Save settings
    await this.saveSettings();

    // Emit change event
    this.emit('settingChanged', { key, oldValue, newValue: value, requiresRestart: definition.requiresRestart });

    // Broadcast to other processes
    await this.ipcManager.sendMessage({
      id: `settings-changed-${Date.now()}`,
      type: 'settings:changed',
      from: 'main',
      to: 'all',
      payload: {
        key,
        value,
        requiresRestart: definition.requiresRestart
      },
      timestamp: new Date()
    });

    // Check dependencies
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        this.emit('dependencyChanged', { setting: key, dependency: dep });
      }
    }
  }

  public getSettingDefinition(key: string): SettingDefinition | null {
    for (const group of this.settingsGroups.values()) {
      const setting = group.settings.find(s => s.key === key);
      if (setting) return setting;
    }
    return null;
  }

  private validateSetting(key: string, value: any): boolean {
    const definition = this.getSettingDefinition(key);
    if (!definition) return false;

    if (definition.validation) {
      return definition.validation(value);
    }

    // Type validation
    switch (definition.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null;
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  private migrateSetting(key: string, value: any, version: string): any {
    const definition = this.getSettingDefinition(key);
    if (!definition || !definition.migration) {
      return value;
    }

    return definition.migration(value, version);
  }

  private async saveSettings(): Promise<void> {
    const settingsObject = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      settings: Object.fromEntries(this.settings)
    };

    const data = JSON.stringify(settingsObject, null, 2);
    await fs.promises.writeFile(this.settingsPath, data, 'utf-8');
  }

  public async createUserProfile(name: string, preferences: Map<string, any> = new Map()): Promise<string> {
    const profile: UserProfile = {
      id: this.generateId(),
      name,
      preferences,
      createdAt: new Date(),
      lastModified: new Date(),
      version: '1.0.0'
    };

    this.userProfiles.set(profile.id, profile);
    await this.saveUserProfile(profile);

    this.emit('profileCreated', profile);
    return profile.id;
  }

  public async switchProfile(profileId: string): Promise<void> {
    const profile = this.userProfiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    this.currentProfile = profileId;

    // Apply profile preferences
    for (const [key, value] of profile.preferences) {
      if (this.getSettingDefinition(key)) {
        await this.setSetting(key, value);
      }
    }

    this.emit('profileSwitched', profile);
  }

  public getCurrentProfile(): UserProfile | null {
    return this.currentProfile ? this.userProfiles.get(this.currentProfile) || null : null;
  }

  public async updateProfilePreference(profileId: string, key: string, value: any): Promise<void> {
    const profile = this.userProfiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    profile.preferences.set(key, value);
    profile.lastModified = new Date();

    await this.saveUserProfile(profile);
    this.emit('profileUpdated', profile);
  }

  private async saveUserProfile(profile: UserProfile): Promise<void> {
    const profilePath = path.join(this.profilesPath, `${profile.id}.json`);
    const data = JSON.stringify(profile, null, 2);
    await fs.promises.writeFile(profilePath, data, 'utf-8');
  }

  public getTheme(name: string): ThemeDefinition | null {
    return this.themes.get(name) || null;
  }

  public getAllThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }

  public async applyTheme(themeName: string): Promise<void> {
    const theme = this.themes.get(themeName);
    if (!theme) {
      throw new Error(`Theme not found: ${themeName}`);
    }

    await this.setSetting('theme', themeName);
    this.emit('themeApplied', theme);

    // Broadcast theme change
    await this.ipcManager.sendMessage({
      id: `theme-changed-${Date.now()}`,
      type: 'theme:changed',
      from: 'main',
      to: 'all',
      payload: theme,
      timestamp: new Date()
    });
  }

  public getLayoutPreset(name: string): LayoutPreset | null {
    return this.layoutPresets.get(name) || null;
  }

  public getAllLayoutPresets(): LayoutPreset[] {
    return Array.from(this.layoutPresets.values());
  }

  public async applyLayoutPreset(presetName: string): Promise<void> {
    const preset = this.layoutPresets.get(presetName);
    if (!preset) {
      throw new Error(`Layout preset not found: ${presetName}`);
    }

    await this.setSetting('layoutPreset', presetName);
    this.emit('layoutPresetApplied', preset);

    // Broadcast layout change
    await this.ipcManager.sendMessage({
      id: `layout-changed-${Date.now()}`,
      type: 'layout:changed',
      from: 'main',
      to: 'all',
      payload: preset,
      timestamp: new Date()
    });
  }

  public async exportSettings(): Promise<string> {
    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      settings: Object.fromEntries(this.settings),
      profiles: Array.from(this.userProfiles.values()),
      themes: Array.from(this.themes.values()).filter(t => !['light', 'dark'].includes(t.name))
    };

    const data = JSON.stringify(exportData, null, 2);
    const dataBytes = new TextEncoder().encode(data);
    const key = crypto.getRandomValues(new Uint8Array(32)); // Generate encryption key
    
    const encrypted = await this.security.encryptData(dataBytes, key);
    
    // Return base64 encoded encrypted data with key
    const encryptedBase64 = Buffer.from(encrypted).toString('base64');
    const keyBase64 = Buffer.from(key).toString('base64');
    
    return `${encryptedBase64}:${keyBase64}`;
  }

  public async importSettings(encryptedData: string): Promise<void> {
    try {
      const [encryptedBase64, keyBase64] = encryptedData.split(':');
      const encrypted = new Uint8Array(Buffer.from(encryptedBase64, 'base64'));
      const key = new Uint8Array(Buffer.from(keyBase64, 'base64'));
      
      const decrypted = await this.security.decryptData(encrypted, key);
      const data = new TextDecoder().decode(decrypted);
      const importData = JSON.parse(data);

      // Import settings
      if (importData.settings) {
        for (const [key, value] of Object.entries(importData.settings)) {
          if (this.getSettingDefinition(key)) {
            await this.setSetting(key, value);
          }
        }
      }

      // Import profiles
      if (importData.profiles) {
        for (const profile of importData.profiles) {
          this.userProfiles.set(profile.id, profile);
          await this.saveUserProfile(profile);
        }
      }

      // Import themes
      if (importData.themes) {
        for (const theme of importData.themes) {
          this.themes.set(theme.name, theme);
          const themePath = path.join(this.themesPath, `${theme.name}.json`);
          await fs.promises.writeFile(themePath, JSON.stringify(theme, null, 2), 'utf-8');
        }
      }

      this.emit('settingsImported', importData);

    } catch (error) {
      throw new Error(`Failed to import settings: ${error}`);
    }
  }

  public async synchronizeSettings(deviceId: string): Promise<void> {
    // This would implement cloud synchronization
    // For now, we'll emit an event for future implementation
    this.emit('syncRequested', { deviceId });
  }

  public getAccessibilitySettings(): AccessibilitySettings {
    return {
      highContrast: this.getSetting('accessibility.highContrast'),
      reducedMotion: this.getSetting('accessibility.reducedMotion'),
      fontSize: this.getSetting('accessibility.fontSize'),
      colorScheme: this.getSetting('accessibility.colorScheme'),
      screenReader: this.getSetting('accessibility.screenReader'),
      keyboardNavigation: this.getSetting('accessibility.keyboardNavigation'),
      focusIndicators: this.getSetting('accessibility.focusIndicators'),
      zoomLevel: this.getSetting('accessibility.zoomLevel')
    };
  }

  public async updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      const settingKey = `accessibility.${key}`;
      if (this.getSettingDefinition(settingKey)) {
        await this.setSetting(settingKey, value);
      }
    }

    this.emit('accessibilitySettingsUpdated', settings);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public getSettingsSummary(): any {
    const summary: any = {
      groups: {},
      totalSettings: this.settings.size,
      profiles: this.userProfiles.size,
      themes: this.themes.size,
      layouts: this.layoutPresets.size
    };

    for (const [groupName, group] of this.settingsGroups) {
      summary.groups[groupName] = {
        description: group.description,
        settingsCount: group.settings.length,
        settings: group.settings.map(s => ({
          key: s.key,
          type: s.type,
          category: s.category,
          hasValidation: !!s.validation,
          requiresRestart: !!s.requiresRestart
        }))
      };
    }

    return summary;
  }

  public async resetToDefaults(): Promise<void> {
    this.settings.clear();
    this.initializeDefaultSettings();

    await this.saveSettings();
    this.emit('settingsReset');

    // Broadcast reset event
    await this.ipcManager.sendMessage({
      id: `settings-reset-${Date.now()}`,
      type: 'settings:reset',
      from: 'main',
      to: 'all',
      payload: {},
      timestamp: new Date()
    });
  }
}
