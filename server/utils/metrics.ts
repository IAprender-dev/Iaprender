import { StatsD } from 'node-statsd';
import { CloudWatch } from '@aws-sdk/client-cloudwatch';
import { envConfig } from '../config/environment';

interface MetricTags {
  [key: string]: string | number | boolean;
}

export class MetricsCollector {
  private statsd?: StatsD;
  private cloudwatch?: CloudWatch;
  private namespace = 'IAprender';
  private buffer: Map<string, number> = new Map();
  private flushInterval?: NodeJS.Timeout;

  constructor() {
    if (!envConfig.monitoring.enableMetrics) return;

    // Initialize StatsD client for local metrics
    if (envConfig.isDevelopment) {
      this.statsd = new StatsD({
        host: 'localhost',
        port: 8125,
        prefix: 'iaprender.',
        errorHandler: (error) => {
          console.warn('StatsD error:', error.message);
        }
      });
    }

    // Initialize CloudWatch for production
    if (envConfig.isProduction && envConfig.aws.region) {
      this.cloudwatch = new CloudWatch({
        region: envConfig.aws.region
      });
      
      // Flush metrics to CloudWatch every 60 seconds
      this.flushInterval = setInterval(() => {
        this.flushToCloudWatch();
      }, 60000);
    }
  }

  // Counter metric
  public increment(metric: string, tags?: MetricTags, value: number = 1): void {
    if (!envConfig.monitoring.enableMetrics) return;

    const key = this.buildMetricKey(metric, tags);
    
    // Local StatsD
    if (this.statsd) {
      this.statsd.increment(key, value);
    }

    // Buffer for CloudWatch
    if (this.cloudwatch) {
      const current = this.buffer.get(key) || 0;
      this.buffer.set(key, current + value);
    }
  }

  // Gauge metric
  public gauge(metric: string, value: number, tags?: MetricTags): void {
    if (!envConfig.monitoring.enableMetrics) return;

    const key = this.buildMetricKey(metric, tags);
    
    if (this.statsd) {
      this.statsd.gauge(key, value);
    }

    if (this.cloudwatch) {
      this.sendToCloudWatch(metric, value, 'None', tags);
    }
  }

  // Timing metric
  public timing(metric: string, duration: number, tags?: MetricTags): void {
    if (!envConfig.monitoring.enableMetrics) return;

    const key = this.buildMetricKey(metric, tags);
    
    if (this.statsd) {
      this.statsd.timing(key, duration);
    }

    if (this.cloudwatch) {
      this.sendToCloudWatch(metric, duration, 'Milliseconds', tags);
    }
  }

  // Histogram metric
  public histogram(metric: string, value: number, tags?: MetricTags): void {
    if (!envConfig.monitoring.enableMetrics) return;

    const key = this.buildMetricKey(metric, tags);
    
    if (this.statsd) {
      this.statsd.histogram(key, value);
    }

    if (this.cloudwatch) {
      this.sendToCloudWatch(metric, value, 'None', tags);
    }
  }

  // Helper to time async operations
  public async timeAsync<T>(
    metric: string, 
    fn: () => Promise<T>, 
    tags?: MetricTags
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.timing(metric, Date.now() - start, { ...tags, success: true });
      return result;
    } catch (error) {
      this.timing(metric, Date.now() - start, { ...tags, success: false });
      throw error;
    }
  }

  // Memory usage metrics
  public collectMemoryMetrics(): void {
    if (!envConfig.monitoring.enableMetrics) return;

    const memUsage = process.memoryUsage();
    
    this.gauge('memory.rss', memUsage.rss);
    this.gauge('memory.heap_total', memUsage.heapTotal);
    this.gauge('memory.heap_used', memUsage.heapUsed);
    this.gauge('memory.external', memUsage.external);
    
    if (memUsage.arrayBuffers) {
      this.gauge('memory.array_buffers', memUsage.arrayBuffers);
    }
  }

  // CPU usage metrics
  public collectCPUMetrics(): void {
    if (!envConfig.monitoring.enableMetrics) return;

    const cpuUsage = process.cpuUsage();
    
    this.gauge('cpu.user', cpuUsage.user);
    this.gauge('cpu.system', cpuUsage.system);
  }

  // Event loop lag metric
  public measureEventLoopLag(): void {
    if (!envConfig.monitoring.enableMetrics) return;

    let start = process.hrtime.bigint();
    
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
      this.histogram('event_loop.lag', lag);
    });
  }

  // Build metric key with tags
  private buildMetricKey(metric: string, tags?: MetricTags): string {
    if (!tags || Object.keys(tags).length === 0) {
      return metric;
    }

    const tagString = Object.entries(tags)
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    return `${metric},${tagString}`;
  }

  // Send metrics to CloudWatch
  private async sendToCloudWatch(
    metricName: string, 
    value: number, 
    unit: string = 'None',
    tags?: MetricTags
  ): Promise<void> {
    if (!this.cloudwatch) return;

    try {
      const dimensions = tags ? Object.entries(tags).map(([Name, Value]) => ({
        Name,
        Value: String(Value)
      })) : [];

      await this.cloudwatch.putMetricData({
        Namespace: this.namespace,
        MetricData: [{
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: dimensions
        }]
      });
    } catch (error) {
      console.error('Failed to send metric to CloudWatch:', error);
    }
  }

  // Flush buffered metrics to CloudWatch
  private async flushToCloudWatch(): Promise<void> {
    if (!this.cloudwatch || this.buffer.size === 0) return;

    const metricsData = Array.from(this.buffer.entries()).map(([key, value]) => {
      const [metricName, ...tagParts] = key.split(',');
      const dimensions = tagParts.map(tag => {
        const [name, val] = tag.split(':');
        return { Name: name, Value: val };
      });

      return {
        MetricName: metricName,
        Value: value,
        Unit: 'Count',
        Timestamp: new Date(),
        Dimensions: dimensions
      };
    });

    try {
      // CloudWatch allows max 20 metrics per request
      for (let i = 0; i < metricsData.length; i += 20) {
        await this.cloudwatch.putMetricData({
          Namespace: this.namespace,
          MetricData: metricsData.slice(i, i + 20)
        });
      }
      
      this.buffer.clear();
    } catch (error) {
      console.error('Failed to flush metrics to CloudWatch:', error);
    }
  }

  // Cleanup
  public close(): void {
    if (this.statsd) {
      this.statsd.close();
    }

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushToCloudWatch(); // Final flush
    }
  }
}

// Singleton instance
let metricsInstance: MetricsCollector;

export function getMetrics(): MetricsCollector {
  if (!metricsInstance) {
    metricsInstance = new MetricsCollector();
  }
  return metricsInstance;
}