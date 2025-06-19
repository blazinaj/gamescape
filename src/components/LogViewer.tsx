import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, logger } from '../services/Logger';
import { 
  Terminal, 
  X, 
  Download, 
  Trash2, 
  Filter, 
  Search,
  ChevronDown,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';

interface LogViewerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ isVisible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogEntry['level'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return unsubscribe;
  }, [isVisible]);

  useEffect(() => {
    let filtered = logs;

    // Filter by level
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filterLevel, searchTerm]);

  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, isAutoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setIsAutoScroll(isAtBottom);
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      case 'debug': return <Bug className="w-4 h-4 text-purple-400" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'error': return 'text-red-300 bg-red-900 bg-opacity-20 border-red-500';
      case 'warn': return 'text-yellow-300 bg-yellow-900 bg-opacity-20 border-yellow-500';
      case 'info': return 'text-blue-300 bg-blue-900 bg-opacity-20 border-blue-500';
      case 'debug': return 'text-purple-300 bg-purple-900 bg-opacity-20 border-purple-500';
      default: return 'text-gray-300 bg-gray-800 bg-opacity-40 border-gray-600';
    }
  };

  const handleCopyLog = async (log: LogEntry) => {
    const logText = `[${formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] ${log.message}`;
    
    try {
      await navigator.clipboard.writeText(logText);
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy log:', error);
    }
  };

  const handleExportLogs = () => {
    const content = logger.exportLogs();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      logger.clear();
    }
  };

  const getLogCounts = () => {
    return {
      total: logs.length,
      error: logs.filter(l => l.level === 'error').length,
      warn: logs.filter(l => l.level === 'warn').length,
      info: logs.filter(l => l.level === 'info').length,
      debug: logs.filter(l => l.level === 'debug').length,
      log: logs.filter(l => l.level === 'log').length,
    };
  };

  if (!isVisible) return null;

  const counts = getLogCounts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-5/6 flex flex-col m-4 border border-gray-700">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-lg flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-green-400" />
            <div>
              <h2 className="text-xl font-bold">System Logs</h2>
              <p className="text-sm text-gray-400">
                Total: {counts.total} | 
                Errors: {counts.error} | 
                Warnings: {counts.warn} | 
                Info: {counts.info} | 
                Debug: {counts.debug}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="text-gray-400 hover:text-white p-2 rounded transition-colors"
              title="Export logs"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearLogs}
              className="text-gray-400 hover:text-red-400 p-2 rounded transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as LogEntry['level'] | 'all')}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors ({counts.error})</option>
              <option value="warn">Warnings ({counts.warn})</option>
              <option value="info">Info ({counts.info})</option>
              <option value="debug">Debug ({counts.debug})</option>
              <option value="log">Logs ({counts.log})</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1 flex-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={isAutoScroll}
                onChange={(e) => setIsAutoScroll(e.target.checked)}
                className="text-blue-500"
              />
              Auto-scroll
            </label>
          </div>
        </div>

        {/* Logs */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-900 font-mono text-sm"
          onScroll={handleScroll}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {logs.length === 0 ? 'No logs available' : 'No logs match your filters'}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded border-l-4 ${getLevelColor(log.level)} transition-all hover:bg-opacity-30 group`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-bold">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                          log.level === 'error' ? 'bg-red-600' :
                          log.level === 'warn' ? 'bg-yellow-600' :
                          log.level === 'info' ? 'bg-blue-600' :
                          log.level === 'debug' ? 'bg-purple-600' :
                          'bg-gray-600'
                        }`}>
                          {log.level}
                        </span>
                      </div>
                      <div className="text-white whitespace-pre-wrap break-words">
                        {log.message}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyLog(log)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-1 rounded transition-all"
                    title="Copy log entry"
                  >
                    {copiedId === log.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Status bar */}
        <div className="bg-gray-800 px-4 py-2 rounded-b-lg border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
          <div>
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
          <div className="flex items-center gap-4">
            {!isAutoScroll && (
              <button
                onClick={() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
            <div>Press Ctrl+Shift+L to toggle this window</div>
          </div>
        </div>
      </div>
    </div>
  );
};