import { Request, Response, NextFunction } from 'express';

/**
 * Wrap async route handlers to properly catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wrap async middleware to properly catch errors
 */
export const asyncMiddleware = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Create async handler with custom error handling
 */
export const createAsyncHandler = (options: {
  onError?: (error: Error, req: Request, res: Response) => void;
  logErrors?: boolean;
  transformError?: (error: Error) => Error;
}) => {
  const { onError, logErrors = true, transformError } = options;

  return (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fn(req, res, next);
      } catch (error: any) {
        if (logErrors) {
          console.error(`Error in ${req.method} ${req.path}:`, error);
        }

        let finalError = error;
        
        if (transformError) {
          finalError = transformError(error);
        }

        if (onError) {
          onError(finalError, req, res);
        } else {
          next(finalError);
        }
      }
    };
  };
};

/**
 * Parallel async handler for running multiple async operations
 */
export const parallelAsyncHandler = (
  ...fns: Array<(req: Request, res: Response) => Promise<any>>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.all(fns.map(fn => fn(req, res)));
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Sequential async handler for running operations in order
 */
export const sequentialAsyncHandler = (
  ...fns: Array<(req: Request, res: Response) => Promise<any>>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const fn of fns) {
        await fn(req, res);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Conditional async handler
 */
export const conditionalAsyncHandler = (
  condition: (req: Request) => boolean | Promise<boolean>,
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shouldRun = await Promise.resolve(condition(req));
      if (shouldRun) {
        await handler(req, res, next);
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Timeout async handler
 */
export const timeoutAsyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  timeout: number = 30000 // 30 seconds default
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    try {
      await Promise.race([
        fn(req, res, next),
        timeoutPromise
      ]);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Retry async handler
 */
export const retryAsyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
) => {
  const {
    retries = 3,
    delay = 1000,
    backoff = 2,
    onRetry
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await fn(req, res, next);
        return;
      } catch (error: any) {
        lastError = error;
        
        if (onRetry) {
          onRetry(error, attempt);
        }

        if (attempt < retries) {
          const waitTime = delay * Math.pow(backoff, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    next(lastError!);
  };
};

/**
 * Cache async handler results
 */
export const cachedAsyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  options: {
    ttl?: number;
    keyGenerator?: (req: Request) => string;
  } = {}
) => {
  const cache = new Map<string, { data: any; expires: number }>();
  const { ttl = 60000, keyGenerator } = options; // 1 minute default

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : `${req.method}:${req.path}`;
    const cached = cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return res.json(cached.data);
    }

    try {
      const result = await fn(req, res, next);
      
      if (result !== undefined) {
        cache.set(key, {
          data: result,
          expires: Date.now() + ttl
        });
      }
    } catch (error) {
      next(error);
    }
  };
};