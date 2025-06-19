export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  data?: any[];
}

export class Logger {
  private static instance: Logger | null = null;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private subscribers: ((logs: LogEntry[]) => void)[] = [];
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  private constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console)
    };

    this.interceptConsole();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private interceptConsole(): void {
    const self = this;

    // Override console methods
    console.log = (...args: any[]) => {
      self.originalConsole.log(...args);
      self.addLog('log', self.formatMessage(args), args);
    };

    console.info = (...args: any[]) => {
      self.originalConsole.info(...args);
      self.addLog('info', self.formatMessage(args), args);
    };

    console.warn = (...args: any[]) => {
      self.originalConsole.warn(...args);
      self.addLog('warn', self.formatMessage(args), args);
    };

    console.error = (...args: any[]) => {
      self.originalConsole.error(...args);
      self.addLog('error', self.formatMessage(args), args);
    };

    console.debug = (...args: any[]) => {
      self.originalConsole.debug(...args);
      self.addLog('debug', self.formatMessage(args), args);
    };
  }

  private formatMessage(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  private addLog(level: LogEntry['level'], message: string, data?: any[]): void {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      data
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify subscribers
    this.notifySubscribers();
  }

  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.subscribers.push(callback);
    
    // Immediately call with current logs
    callback([...this.logs]);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback([...this.logs]);
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
    this.notifySubscribers();
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  exportLogs(): string {
    return this.logs.map(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      return `[${timestamp}] [${log.level.toUpperCase()}] ${log.message}`;
    }).join('\n');
  }
}

// Initialize the logger immediately
export const logger = Logger.getInstance();