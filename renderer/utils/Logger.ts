/**
 * 日志工具
 * 支持不同级别的日志输出，可配置是否启用
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class LoggerImpl {
  private config: LoggerConfig = {
    enabled: true,
    level: 'warn', // 默认只输出 warn 和 error
  };

  /**
   * 设置日志配置
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = {...this.config, ...config};
  }

  /**
   * 启用日志
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * 禁用日志
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 输出 debug 日志
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  /**
   * 输出 info 日志
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  /**
   * 输出 warn 日志
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  /**
   * 输出 error 日志
   */
  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.config.enabled) return;
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.level]) return;

    const timestamp = new Date().toISOString();
    const prefix = `[CanvasRenderer][${level.toUpperCase()}]`;

    if (data !== undefined) {
      console.log(`${timestamp} ${prefix} ${message}`, data);
    } else {
      console.log(`${timestamp} ${prefix} ${message}`);
    }
  }
}

export const logger = new LoggerImpl();
