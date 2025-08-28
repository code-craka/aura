import { EventEmitter } from 'events';
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
export declare class AuraSettingsManager extends EventEmitter {
    private settings;
    private settingsGroups;
    private userProfiles;
    private themes;
    private layoutPresets;
    private currentProfile;
    private settingsPath;
    private profilesPath;
    private themesPath;
    private security;
    private ipcManager;
    private eventSystem;
    private isInitialized;
    constructor(settingsPath: string, security: AuraSecurityFramework, ipcManager: AuraIPCManager, eventSystem: AuraEventBus);
    private initializeDefaultSettings;
    private initializeDefaultThemes;
    private initializeDefaultLayouts;
    initialize(): Promise<void>;
    private loadSettings;
    private loadUserProfiles;
    private loadCustomThemes;
    registerSettingsGroup(group: SettingsGroup): void;
    registerTheme(theme: ThemeDefinition): void;
    registerLayoutPreset(layout: LayoutPreset): void;
    getSetting(key: string): any;
    setSetting(key: string, value: any): Promise<void>;
    getSettingDefinition(key: string): SettingDefinition | null;
    private validateSetting;
    private migrateSetting;
    private saveSettings;
    createUserProfile(name: string, preferences?: Map<string, any>): Promise<string>;
    switchProfile(profileId: string): Promise<void>;
    getCurrentProfile(): UserProfile | null;
    updateProfilePreference(profileId: string, key: string, value: any): Promise<void>;
    private saveUserProfile;
    getTheme(name: string): ThemeDefinition | null;
    getAllThemes(): ThemeDefinition[];
    applyTheme(themeName: string): Promise<void>;
    getLayoutPreset(name: string): LayoutPreset | null;
    getAllLayoutPresets(): LayoutPreset[];
    applyLayoutPreset(presetName: string): Promise<void>;
    exportSettings(): Promise<string>;
    importSettings(encryptedData: string): Promise<void>;
    synchronizeSettings(deviceId: string): Promise<void>;
    getAccessibilitySettings(): AccessibilitySettings;
    updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): Promise<void>;
    private generateId;
    getSettingsSummary(): any;
    resetToDefaults(): Promise<void>;
}
//# sourceMappingURL=settings-manager.d.ts.map