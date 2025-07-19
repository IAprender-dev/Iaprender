import { 
  sql, 
  eq, 
  and, 
  or, 
  gt, 
  gte, 
  lt, 
  lte, 
  ne, 
  like, 
  ilike,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  between,
  exists,
  notExists,
  asc,
  desc,
  SQL,
  InferModel
} from 'drizzle-orm';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { DatabaseConnection } from '../config/database-production';
import { Logger } from '../utils/logger';
import { MetricsCollector, getMetrics } from '../utils/metrics';
import { Cache, getCache } from '../utils/cache';
import { AppErrors } from '../middleware/errorHandler';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    direction?: 'asc' | 'desc';
  }[];
  select?: string[];
  include?: string[];
  cache?: boolean;
  cacheTtl?: number;
  transaction?: any;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FilterOperator {
  eq?: any;
  ne?: any;
  gt?: any;
  gte?: any;
  lt?: any;
  lte?: any;
  like?: string;
  ilike?: string;
  in?: any[];
  notIn?: any[];
  between?: [any, any];
  isNull?: boolean;
  isNotNull?: boolean;
}

export type FilterConditions<T> = {
  [K in keyof T]?: T[K] | FilterOperator;
} & {
  _or?: FilterConditions<T>[];
  _and?: FilterConditions<T>[];
  _not?: FilterConditions<T>;
};

export abstract class BaseRepository<
  TTable extends PgTable,
  TInsert extends InferModel<TTable, 'insert'>,
  TSelect extends InferModel<TTable, 'select'>
> {
  protected db: DatabaseConnection;
  protected logger: Logger;
  protected metrics: MetricsCollector;
  protected cache: Cache;
  protected cacheTtl: number = 300; // 5 minutes default

  constructor(
    protected table: TTable,
    protected tableName: string
  ) {
    this.db = DatabaseConnection.getInstance();
    this.logger = new Logger(`Repository:${tableName}`);
    this.metrics = getMetrics();
    this.cache = getCache(`repo:${tableName}`, this.cacheTtl);
  }

  /**
   * Find all records with optional filtering and pagination
   */
  public async findAll(
    conditions?: FilterConditions<TSelect>,
    options: QueryOptions = {}
  ): Promise<TSelect[]> {
    const timer = this.metrics.startTimer();
    
    try {
      // Check cache
      if (options.cache) {
        const cacheKey = this.buildCacheKey('findAll', conditions, options);
        const cached = this.cache.get<TSelect[]>(cacheKey);
        if (cached) {
          this.metrics.increment('repository.cache.hit', { table: this.tableName });
          return cached;
        }
      }

      const db = options.transaction || this.getDb();
      let query = db.select().from(this.table);

      // Apply filters
      if (conditions) {
        const whereClause = this.buildWhereClause(conditions);
        if (whereClause) {
          query = query.where(whereClause);
        }
      }

      // Apply ordering
      if (options.orderBy) {
        for (const order of options.orderBy) {
          const column = (this.table as any)[order.column];
          if (column) {
            query = query.orderBy(
              order.direction === 'desc' ? desc(column) : asc(column)
            );
          }
        }
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const results = await query;
      
      // Cache results
      if (options.cache) {
        const cacheKey = this.buildCacheKey('findAll', conditions, options);
        this.cache.set(cacheKey, results, options.cacheTtl);
      }

      const duration = timer();
      this.logger.debug('Find all completed', { 
        table: this.tableName, 
        count: results.length,
        duration 
      });
      this.metrics.timing('repository.findAll.duration', duration, { 
        table: this.tableName 
      });

      return results as TSelect[];

    } catch (error) {
      const duration = timer();
      this.logger.error('Find all failed', error, { 
        table: this.tableName,
        duration 
      });
      this.metrics.increment('repository.findAll.error', { 
        table: this.tableName 
      });
      throw error;
    }
  }

  /**
   * Find records with pagination
   */
  public async findPaginated(
    conditions?: FilterConditions<TSelect>,
    page: number = 1,
    pageSize: number = 20,
    options: QueryOptions = {}
  ): Promise<PaginationResult<TSelect>> {
    const timer = this.metrics.startTimer();
    
    try {
      // Get total count
      const total = await this.count(conditions, options);
      
      // Calculate pagination
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;
      
      // Get paginated data
      const data = await this.findAll(conditions, {
        ...options,
        limit: pageSize,
        offset
      });

      const result: PaginationResult<TSelect> = {
        data,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      };

      const duration = timer();
      this.metrics.timing('repository.findPaginated.duration', duration, { 
        table: this.tableName 
      });

      return result;

    } catch (error) {
      const duration = timer();
      this.logger.error('Find paginated failed', error, { 
        table: this.tableName,
        duration 
      });
      throw error;
    }
  }

  /**
   * Find one record by ID
   */
  public async findById(
    id: string | number,
    options: QueryOptions = {}
  ): Promise<TSelect | null> {
    const timer = this.metrics.startTimer();
    
    try {
      // Check cache
      if (options.cache) {
        const cacheKey = `findById:${id}`;
        const cached = this.cache.get<TSelect>(cacheKey);
        if (cached) {
          this.metrics.increment('repository.cache.hit', { table: this.tableName });
          return cached;
        }
      }

      const db = options.transaction || this.getDb();
      const idColumn = (this.table as any).id;
      
      if (!idColumn) {
        throw new Error(`Table ${this.tableName} does not have an id column`);
      }

      const results = await db
        .select()
        .from(this.table)
        .where(eq(idColumn, id))
        .limit(1);

      const record = results[0] as TSelect || null;

      // Cache result
      if (options.cache && record) {
        const cacheKey = `findById:${id}`;
        this.cache.set(cacheKey, record, options.cacheTtl);
      }

      const duration = timer();
      this.logger.debug('Find by ID completed', { 
        table: this.tableName,
        id,
        found: !!record,
        duration 
      });
      this.metrics.timing('repository.findById.duration', duration, { 
        table: this.tableName 
      });

      return record;

    } catch (error) {
      const duration = timer();
      this.logger.error('Find by ID failed', error, { 
        table: this.tableName,
        id,
        duration 
      });
      throw error;
    }
  }

  /**
   * Find one record by conditions
   */
  public async findOne(
    conditions: FilterConditions<TSelect>,
    options: QueryOptions = {}
  ): Promise<TSelect | null> {
    const results = await this.findAll(conditions, { ...options, limit: 1 });
    return results[0] || null;
  }

  /**
   * Create a new record
   */
  public async create(
    data: TInsert,
    options: QueryOptions = {}
  ): Promise<TSelect> {
    const timer = this.metrics.startTimer();
    
    try {
      const db = options.transaction || this.getDb();
      
      const results = await db
        .insert(this.table)
        .values(data)
        .returning();

      const created = results[0] as TSelect;

      // Invalidate cache
      this.invalidateCache();

      const duration = timer();
      this.logger.info('Record created', { 
        table: this.tableName,
        id: (created as any).id,
        duration 
      });
      this.metrics.timing('repository.create.duration', duration, { 
        table: this.tableName 
      });
      this.metrics.increment('repository.create.success', { 
        table: this.tableName 
      });

      return created;

    } catch (error) {
      const duration = timer();
      this.logger.error('Create failed', error, { 
        table: this.tableName,
        duration 
      });
      this.metrics.increment('repository.create.error', { 
        table: this.tableName 
      });
      throw error;
    }
  }

  /**
   * Create multiple records
   */
  public async createMany(
    data: TInsert[],
    options: QueryOptions = {}
  ): Promise<TSelect[]> {
    const timer = this.metrics.startTimer();
    
    try {
      const db = options.transaction || this.getDb();
      
      const results = await db
        .insert(this.table)
        .values(data)
        .returning();

      // Invalidate cache
      this.invalidateCache();

      const duration = timer();
      this.logger.info('Multiple records created', { 
        table: this.tableName,
        count: results.length,
        duration 
      });
      this.metrics.timing('repository.createMany.duration', duration, { 
        table: this.tableName 
      });

      return results as TSelect[];

    } catch (error) {
      const duration = timer();
      this.logger.error('Create many failed', error, { 
        table: this.tableName,
        duration 
      });
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  public async update(
    id: string | number,
    data: Partial<TInsert>,
    options: QueryOptions = {}
  ): Promise<TSelect | null> {
    const timer = this.metrics.startTimer();
    
    try {
      const db = options.transaction || this.getDb();
      const idColumn = (this.table as any).id;
      
      if (!idColumn) {
        throw new Error(`Table ${this.tableName} does not have an id column`);
      }

      const results = await db
        .update(this.table)
        .set(data)
        .where(eq(idColumn, id))
        .returning();

      const updated = results[0] as TSelect || null;

      // Invalidate cache
      this.invalidateCache();
      this.cache.delete(`findById:${id}`);

      const duration = timer();
      this.logger.info('Record updated', { 
        table: this.tableName,
        id,
        updated: !!updated,
        duration 
      });
      this.metrics.timing('repository.update.duration', duration, { 
        table: this.tableName 
      });

      return updated;

    } catch (error) {
      const duration = timer();
      this.logger.error('Update failed', error, { 
        table: this.tableName,
        id,
        duration 
      });
      throw error;
    }
  }

  /**
   * Update multiple records
   */
  public async updateMany(
    conditions: FilterConditions<TSelect>,
    data: Partial<TInsert>,
    options: QueryOptions = {}
  ): Promise<number> {
    const timer = this.metrics.startTimer();
    
    try {
      const db = options.transaction || this.getDb();
      let query = db.update(this.table).set(data);

      const whereClause = this.buildWhereClause(conditions);
      if (whereClause) {
        query = query.where(whereClause);
      }

      const result = await query;
      const count = result.rowCount || 0;

      // Invalidate cache
      this.invalidateCache();

      const duration = timer();
      this.logger.info('Multiple records updated', { 
        table: this.tableName,
        count,
        duration 
      });
      this.metrics.timing('repository.updateMany.duration', duration, { 
        table: this.tableName 
      });

      return count;

    } catch (error) {
      const duration = timer();
      this.logger.error('Update many failed', error, { 
        table: this.tableName,
        duration 
      });
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  public async delete(
    id: string | number,
    options: QueryOptions = {}
  ): Promise<boolean> {
    const timer = this.metrics.startTimer();
    
    try {
      const db = options.transaction || this.getDb();
      const idColumn = (this.table as any).id;
      
      if (!idColumn) {
        throw new Error(`Table ${this.tableName} does not have an id column`);
      }

      const result = await db
        .delete(this.table)
        .where(eq(idColumn, id));

      const deleted = (result.rowCount || 0) > 0;

      // Invalidate cache
      this.invalidateCache();
      this.cache.delete(`findById:${id}`);

      const duration = timer();
      this.logger.info('Record deleted', { 
        table: this.tableName,
        id,
        deleted,
        duration 
      });
      this.metrics.timing('repository.delete.duration', duration, { 
        table: this.tableName 
      });

      return deleted;

    } catch (error) {
      const duration = timer();
      this.logger.error('Delete failed', error, { 
        table: this.tableName,
        id,
        duration 
      });
      throw error;
    }
  }

  /**
   * Delete multiple records
   */
  public async deleteMany(
    conditions: FilterConditions<TSelect>,
    options: QueryOptions = {}
  ): Promise<number> {
    const timer = this.metrics.startTimer();
    
    try {
      const db = options.transaction || this.getDb();
      let query = db.delete(this.table);

      const whereClause = this.buildWhereClause(conditions);
      if (whereClause) {
        query = query.where(whereClause);
      }

      const result = await query;
      const count = result.rowCount || 0;

      // Invalidate cache
      this.invalidateCache();

      const duration = timer();
      this.logger.info('Multiple records deleted', { 
        table: this.tableName,
        count,
        duration 
      });
      this.metrics.timing('repository.deleteMany.duration', duration, { 
        table: this.tableName 
      });

      return count;

    } catch (error) {
      const duration = timer();
      this.logger.error('Delete many failed', error, { 
        table: this.tableName,
        duration 
      });
      throw error;
    }
  }

  /**
   * Count records
   */
  public async count(
    conditions?: FilterConditions<TSelect>,
    options: QueryOptions = {}
  ): Promise<number> {
    const timer = this.metrics.startTimer();
    
    try {
      const db = options.transaction || this.getDb();
      let query = db.select({ count: sql<number>`count(*)::int` }).from(this.table);

      if (conditions) {
        const whereClause = this.buildWhereClause(conditions);
        if (whereClause) {
          query = query.where(whereClause);
        }
      }

      const result = await query;
      const count = result[0]?.count || 0;

      const duration = timer();
      this.metrics.timing('repository.count.duration', duration, { 
        table: this.tableName 
      });

      return count;

    } catch (error) {
      const duration = timer();
      this.logger.error('Count failed', error, { 
        table: this.tableName,
        duration 
      });
      throw error;
    }
  }

  /**
   * Check if record exists
   */
  public async exists(
    conditions: FilterConditions<TSelect>,
    options: QueryOptions = {}
  ): Promise<boolean> {
    const count = await this.count(conditions, options);
    return count > 0;
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
    const db = this.getDb();
    if (!db) {
      throw AppErrors.serviceUnavailable('Database not available');
    }

    return await db.transaction(callback);
  }

  /**
   * Execute raw SQL
   */
  public async raw<T = any>(
    query: string,
    params?: any[]
  ): Promise<T[]> {
    const timer = this.metrics.startTimer();
    
    try {
      const db = this.getDb();
      const result = await db.execute(sql.raw(query, params));
      
      const duration = timer();
      this.logger.debug('Raw query executed', { 
        table: this.tableName,
        duration 
      });
      
      return result.rows as T[];

    } catch (error) {
      const duration = timer();
      this.logger.error('Raw query failed', error, { 
        table: this.tableName,
        duration 
      });
      throw error;
    }
  }

  /**
   * Build WHERE clause from conditions
   */
  protected buildWhereClause(conditions: FilterConditions<TSelect>): SQL | undefined {
    const clauses: SQL[] = [];

    for (const [key, value] of Object.entries(conditions)) {
      // Handle special operators
      if (key === '_or' && Array.isArray(value)) {
        const orClauses = value.map(cond => this.buildWhereClause(cond)).filter(Boolean);
        if (orClauses.length > 0) {
          clauses.push(or(...orClauses)!);
        }
        continue;
      }

      if (key === '_and' && Array.isArray(value)) {
        const andClauses = value.map(cond => this.buildWhereClause(cond)).filter(Boolean);
        if (andClauses.length > 0) {
          clauses.push(and(...andClauses)!);
        }
        continue;
      }

      if (key === '_not') {
        const notClause = this.buildWhereClause(value as FilterConditions<TSelect>);
        if (notClause) {
          clauses.push(sql`NOT (${notClause})`);
        }
        continue;
      }

      // Get column
      const column = (this.table as any)[key];
      if (!column) continue;

      // Handle operators
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const operators = value as FilterOperator;
        
        if (operators.eq !== undefined) {
          clauses.push(eq(column, operators.eq));
        }
        if (operators.ne !== undefined) {
          clauses.push(ne(column, operators.ne));
        }
        if (operators.gt !== undefined) {
          clauses.push(gt(column, operators.gt));
        }
        if (operators.gte !== undefined) {
          clauses.push(gte(column, operators.gte));
        }
        if (operators.lt !== undefined) {
          clauses.push(lt(column, operators.lt));
        }
        if (operators.lte !== undefined) {
          clauses.push(lte(column, operators.lte));
        }
        if (operators.like !== undefined) {
          clauses.push(like(column, operators.like));
        }
        if (operators.ilike !== undefined) {
          clauses.push(ilike(column, operators.ilike));
        }
        if (operators.in !== undefined && operators.in.length > 0) {
          clauses.push(inArray(column, operators.in));
        }
        if (operators.notIn !== undefined && operators.notIn.length > 0) {
          clauses.push(notInArray(column, operators.notIn));
        }
        if (operators.between !== undefined) {
          clauses.push(between(column, operators.between[0], operators.between[1]));
        }
        if (operators.isNull === true) {
          clauses.push(isNull(column));
        }
        if (operators.isNotNull === true) {
          clauses.push(isNotNull(column));
        }
      } else {
        // Simple equality
        clauses.push(eq(column, value));
      }
    }

    return clauses.length > 0 ? and(...clauses) : undefined;
  }

  /**
   * Build cache key
   */
  protected buildCacheKey(
    operation: string,
    conditions?: any,
    options?: any
  ): string {
    return Cache.createHashKey({
      table: this.tableName,
      operation,
      conditions,
      options
    });
  }

  /**
   * Invalidate all cache entries for this table
   */
  protected invalidateCache(): void {
    this.cache.flush();
    this.logger.debug('Cache invalidated', { table: this.tableName });
  }

  /**
   * Get database instance
   */
  protected getDb() {
    const db = this.db.getDb();
    if (!db) {
      throw AppErrors.serviceUnavailable('Database not available');
    }
    return db;
  }

  /**
   * Upsert (insert or update) a record
   */
  public async upsert(
    data: TInsert,
    conflictColumns: string[],
    updateColumns?: string[],
    options: QueryOptions = {}
  ): Promise<TSelect> {
    const timer = this.metrics.startTimer();
    
    try {
      const db = options.transaction || this.getDb();
      
      // Build conflict target
      const conflictTarget = conflictColumns.map(col => (this.table as any)[col]);
      
      // Build update set
      const updateSet = updateColumns 
        ? Object.fromEntries(
            updateColumns.map(col => [col, (data as any)[col]])
          )
        : data;

      const results = await db
        .insert(this.table)
        .values(data)
        .onConflictDoUpdate({
          target: conflictTarget,
          set: updateSet
        })
        .returning();

      const upserted = results[0] as TSelect;

      // Invalidate cache
      this.invalidateCache();

      const duration = timer();
      this.logger.info('Record upserted', { 
        table: this.tableName,
        duration 
      });
      this.metrics.timing('repository.upsert.duration', duration, { 
        table: this.tableName 
      });

      return upserted;

    } catch (error) {
      const duration = timer();
      this.logger.error('Upsert failed', error, { 
        table: this.tableName,
        duration 
      });
      throw error;
    }
  }
}