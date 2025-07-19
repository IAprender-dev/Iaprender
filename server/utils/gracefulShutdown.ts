import { Server } from 'http';
import { Logger } from './logger';
import { DatabaseManager } from '../config/database-manager';
import { getMetrics } from './metrics';

export class GracefulShutdown {
  private shutdownTimeout = 30000; // 30 seconds
  private connections = new Set<any>();
  private isShuttingDown = false;

  constructor(
    private server: Server,
    private logger: Logger
  ) {
    this.trackConnections();
  }

  private trackConnections(): void {
    this.server.on('connection', (connection) => {
      this.connections.add(connection);
      
      connection.on('close', () => {
        this.connections.delete(connection);
      });
    });
  }

  public async execute(): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('Starting graceful shutdown');

    try {
      // Step 1: Stop accepting new connections
      await this.stopServer();
      
      // Step 2: Close existing connections gracefully
      await this.closeConnections();
      
      // Step 3: Cleanup resources
      await this.cleanupResources();
      
      this.logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  }

  private stopServer(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.info('Stopping server from accepting new connections');
      
      this.server.close(() => {
        this.logger.info('Server stopped accepting connections');
        resolve();
      });
    });
  }

  private async closeConnections(): Promise<void> {
    this.logger.info(`Closing ${this.connections.size} active connections`);
    
    // Set keep-alive timeout to 0 to close connections faster
    this.server.setTimeout(1);
    
    // Give connections time to close gracefully
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Force close remaining connections
    if (this.connections.size > 0) {
      this.logger.warn(`Force closing ${this.connections.size} remaining connections`);
      
      for (const connection of this.connections) {
        connection.destroy();
      }
    }
  }

  private async cleanupResources(): Promise<void> {
    const cleanupTasks: Promise<void>[] = [];
    
    // Close database connections
    cleanupTasks.push(
      this.cleanupWithTimeout(
        'Database connections',
        () => DatabaseManager.getInstance().close()
      )
    );
    
    // Flush metrics
    cleanupTasks.push(
      this.cleanupWithTimeout(
        'Metrics',
        () => {
          const metrics = getMetrics();
          metrics.close();
          return Promise.resolve();
        }
      )
    );
    
    // Close any open file handles, caches, etc.
    cleanupTasks.push(
      this.cleanupWithTimeout(
        'Cache connections',
        () => this.closeCacheConnections()
      )
    );
    
    // Wait for all cleanup tasks
    await Promise.allSettled(cleanupTasks);
  }

  private async cleanupWithTimeout(
    resource: string,
    cleanup: () => Promise<void>
  ): Promise<void> {
    try {
      this.logger.info(`Cleaning up ${resource}`);
      
      await Promise.race([
        cleanup(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cleanup timeout')), 5000)
        )
      ]);
      
      this.logger.info(`${resource} cleaned up successfully`);
    } catch (error) {
      this.logger.error(`Failed to cleanup ${resource}`, error);
    }
  }

  private async closeCacheConnections(): Promise<void> {
    // Implement cache cleanup if using Redis or similar
    // For now, just resolve
    return Promise.resolve();
  }

  // Force shutdown after timeout
  public enforceTimeout(): void {
    setTimeout(() => {
      this.logger.error('Graceful shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, this.shutdownTimeout);
  }
}