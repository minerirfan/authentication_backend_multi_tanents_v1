export interface SystemConfig {
  id: string;
  isInitialized: boolean;
  initializedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISystemConfigRepository {
  findFirst(): Promise<SystemConfig | null>;
  create(config: Omit<SystemConfig, 'createdAt' | 'updatedAt'>): Promise<SystemConfig>;
  update(id: string, data: Partial<SystemConfig>): Promise<SystemConfig>;
}

