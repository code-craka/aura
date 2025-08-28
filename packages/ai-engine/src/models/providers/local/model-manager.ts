/**
 * Local Model Manager (Stub Implementation)
 * 
 * This is a placeholder implementation for the Local Model Manager.
 * The full implementation will be developed in Phase 2.
 */

export interface LocalModelInfo {
  name: string;
  size: number;
  version: string;
  capabilities: string[];
  quantization: string;
  downloadUrl: string;
  checksum: string;
  isDownloaded: boolean;
  isLoaded: boolean;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

export class LocalModelManager {
  async getModelInfo(modelName: string): Promise<LocalModelInfo> {
    throw new Error('Local Model Manager not yet implemented - will be available in Phase 2');
  }

  async downloadModel(
    modelInfo: LocalModelInfo, 
    progressCallback?: (progress: DownloadProgress) => void
  ): Promise<void> {
    throw new Error('Local Model Manager not yet implemented - will be available in Phase 2');
  }

  async listAvailableModels(): Promise<LocalModelInfo[]> {
    return [];
  }

  async listDownloadedModels(): Promise<LocalModelInfo[]> {
    return [];
  }

  async removeModel(modelName: string): Promise<void> {
    throw new Error('Local Model Manager not yet implemented - will be available in Phase 2');
  }
}
