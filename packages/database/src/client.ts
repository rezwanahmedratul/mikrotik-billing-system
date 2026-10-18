// Prisma Client instance management
export interface DbClientConfig {
  databaseUrl?: string;
  logQueries?: boolean;
}

export class DatabaseService {
  private static instance: DatabaseService;
  public isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
}

export const dbService = DatabaseService.getInstance();
