import { Express, Router, RequestHandler } from 'express';
import { Logger } from '../utils/logger';
import { MetricsCollector, getMetrics } from '../utils/metrics';
import path from 'path';

interface RouteOptions {
  prefix?: string;
  middleware?: RequestHandler[];
  version?: string;
}

interface RouteModule {
  default?: Router;
  router?: Router;
  register?: (app: Express) => void | Promise<void>;
}

export class RouteRegistry {
  private logger: Logger;
  private metrics: MetricsCollector;
  private loadedModules: Map<string, RouteModule> = new Map();

  constructor() {
    this.logger = new Logger('RouteRegistry');
    this.metrics = getMetrics();
  }

  public async register(
    moduleName: string, 
    app: Express, 
    options: RouteOptions = {}
  ): Promise<void> {
    const timer = this.metrics.startTimer();
    
    try {
      this.logger.debug(`Registering route module: ${moduleName}`, options);

      // Load route module
      const module = await this.loadModule(moduleName);
      
      // Apply routes
      if (module.register) {
        // Custom registration function
        await module.register(app);
      } else {
        // Standard router
        const router = module.default || module.router;
        if (!router) {
          throw new Error(`No router found in module: ${moduleName}`);
        }

        const prefix = options.prefix || `/api/${moduleName}`;
        
        // Apply middleware if provided
        if (options.middleware && options.middleware.length > 0) {
          app.use(prefix, ...options.middleware, router);
        } else {
          app.use(prefix, router);
        }
      }

      const duration = timer();
      this.logger.info(`Route module registered: ${moduleName}`, { 
        prefix: options.prefix,
        duration 
      });
      
      this.metrics.timing('route.registration.time', duration, { module: moduleName });
      this.metrics.increment('route.modules.registered');
      
    } catch (error) {
      const duration = timer();
      this.logger.error(`Failed to register route module: ${moduleName}`, error, { duration });
      this.metrics.increment('route.registration.failures', { module: moduleName });
      throw error;
    }
  }

  private async loadModule(moduleName: string): Promise<RouteModule> {
    // Check cache
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName)!;
    }

    try {
      // Try different paths
      const paths = [
        `./modules/${moduleName}`,
        `./modules/${moduleName}/index`,
        `./modules/${moduleName}/routes`,
        `./${moduleName}`,
        `./${moduleName}-routes`
      ];

      let module: RouteModule | null = null;
      let loadError: Error | null = null;

      for (const modulePath of paths) {
        try {
          const fullPath = path.resolve(__dirname, modulePath);
          module = await import(fullPath);
          this.logger.debug(`Loaded route module from: ${fullPath}`);
          break;
        } catch (error) {
          loadError = error as Error;
          continue;
        }
      }

      if (!module) {
        throw new Error(
          `Failed to load route module '${moduleName}'. Last error: ${loadError?.message}`
        );
      }

      // Cache the module
      this.loadedModules.set(moduleName, module);
      
      return module;
    } catch (error) {
      this.logger.error(`Error loading route module: ${moduleName}`, error);
      throw error;
    }
  }

  public async preloadModules(moduleNames: string[]): Promise<void> {
    this.logger.info(`Preloading ${moduleNames.length} route modules`);
    
    const results = await Promise.allSettled(
      moduleNames.map(name => this.loadModule(name))
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(`Failed to preload ${failed.length} modules`);
    }
  }

  public getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  public clearCache(): void {
    this.loadedModules.clear();
    this.logger.info('Route module cache cleared');
  }
}