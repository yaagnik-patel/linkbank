// Crash Detection and Recovery System
import { Platform } from 'react-native';
import { errorMonitor } from './errorMonitoring';

class CrashDetector {
  constructor() {
    this.crashThreshold = 5; // Number of errors before considering it a crash
    this.timeWindow = 60000; // 1 minute time window
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    this.isRecovering = false;
  }

  // Check if app is in crash state
  isCrashState() {
    const recentErrors = errorMonitor.getRecentErrors(this.crashThreshold);
    const now = Date.now();
    
    // Filter errors within time window
    const errorsInWindow = recentErrors.filter(error => {
      const errorTime = new Date(error.timestamp).getTime();
      return (now - errorTime) <= this.timeWindow;
    });

    return errorsInWindow.length >= this.crashThreshold;
  }

  // Attempt recovery
  async attemptRecovery() {
    if (this.isRecovering || this.recoveryAttempts >= this.maxRecoveryAttempts) {
      return false;
    }

    this.isRecovering = true;
    this.recoveryAttempts++;

    console.log(`[CrashDetector] Attempting recovery ${this.recoveryAttempts}/${this.maxRecoveryAttempts}`);

    try {
      // Recovery strategies
      const strategies = [
        this.clearErrorLogs.bind(this),
        this.resetAppState.bind(this),
        this.clearCaches.bind(this)
      ];

      for (const strategy of strategies) {
        try {
          await strategy();
          await this.delay(1000); // Wait between strategies
        } catch (error) {
          console.error('[CrashDetector] Recovery strategy failed:', error);
        }
      }

      // Check if recovery was successful
      if (!this.isCrashState()) {
        console.log('[CrashDetector] Recovery successful');
        this.recoveryAttempts = 0;
        this.isRecovering = false;
        return true;
      }

    } catch (error) {
      console.error('[CrashDetector] Recovery failed:', error);
    }

    this.isRecovering = false;
    return false;
  }

  // Clear error logs
  async clearErrorLogs() {
    console.log('[CrashDetector] Clearing error logs');
    errorMonitor.clearErrors();
  }

  // Reset app state (placeholder for actual app state reset)
  async resetAppState() {
    console.log('[CrashDetector] Resetting app state');
    // This would reset any app-specific state
    // For now, just clear local storage if available
    if (typeof localStorage !== 'undefined') {
      try {
        const keysToKeep = ['userPreferences', 'authToken']; // Keep important keys
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error('[CrashDetector] Failed to clear localStorage:', error);
      }
    }
  }

  // Clear caches
  async clearCaches() {
    console.log('[CrashDetector] Clearing caches');
    
    // Clear service worker cache if available
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      } catch (error) {
        console.error('[CrashDetector] Failed to clear caches:', error);
      }
    }
  }

  // Helper function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get crash status
  getCrashStatus() {
    return {
      isCrashState: this.isCrashState(),
      isRecovering: this.isRecovering,
      recoveryAttempts: this.recoveryAttempts,
      maxRecoveryAttempts: this.maxRecoveryAttempts,
      recentErrors: errorMonitor.getRecentErrors(10)
    };
  }

  // Reset recovery attempts
  resetRecovery() {
    this.recoveryAttempts = 0;
    this.isRecovering = false;
  }
}

// Health monitoring system
class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.lastHealthCheck = null;
    this.healthStatus = 'healthy';
  }

  // Register a health check
  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  // Run all health checks
  async runHealthChecks() {
    const results = {};
    let overallHealthy = true;

    for (const [name, checkFunction] of this.checks) {
      try {
        const result = await checkFunction();
        results[name] = { status: 'healthy', result };
        if (!result) {
          overallHealthy = false;
          results[name] = { status: 'unhealthy', result };
        }
      } catch (error) {
        overallHealthy = false;
        results[name] = { status: 'error', error: error.message };
      }
    }

    this.lastHealthCheck = {
      timestamp: new Date().toISOString(),
      results,
      overallHealthy
    };

    this.healthStatus = overallHealthy ? 'healthy' : 'unhealthy';

    return this.lastHealthCheck;
  }

  // Get current health status
  getHealthStatus() {
    return {
      status: this.healthStatus,
      lastCheck: this.lastHealthCheck,
      timestamp: new Date().toISOString()
    };
  }

  // Setup default health checks
  setupDefaultChecks() {
    // Firebase connectivity check
    this.registerCheck('firebase', async () => {
      try {
        // This would be an actual Firebase connectivity check
        // For now, just return true
        return true;
      } catch (error) {
        return false;
      }
    });

    // Network connectivity check
    this.registerCheck('network', async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
        return navigator.onLine;
      }
      return true; // Assume healthy if can't check
    });

    // Memory check
    this.registerCheck('memory', async () => {
      if (typeof performance !== 'undefined' && performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        return memoryUsage < 0.9; // Healthy if less than 90% memory usage
      }
      return true;
    });
  }
}

// Initialize monitors
export const crashDetector = new CrashDetector();
export const healthMonitor = new HealthMonitor();

// Setup default health checks
healthMonitor.setupDefaultChecks();

// Auto-recovery system
export const setupAutoRecovery = () => {
  // Check for crash state every 30 seconds
  setInterval(async () => {
    if (crashDetector.isCrashState() && !crashDetector.isRecovering) {
      console.log('[AutoRecovery] Crash state detected, attempting recovery');
      const recovered = await crashDetector.attemptRecovery();
      
      if (!recovered) {
        console.log('[AutoRecovery] Recovery failed, app may need manual intervention');
        // Could show user a message to refresh the app
      }
    }
  }, 30000);

  // Run health checks every 5 minutes
  setInterval(async () => {
    const health = await healthMonitor.runHealthChecks();
    if (!health.overallHealthy) {
      console.warn('[HealthMonitor] Unhealthy state detected:', health.results);
    }
  }, 300000);
};

// Get system status
export const getSystemStatus = () => {
  return {
    crash: crashDetector.getCrashStatus(),
    health: healthMonitor.getHealthStatus(),
    errors: errorMonitor.getRecentErrors(5),
    timestamp: new Date().toISOString()
  };
};

export default {
  crashDetector,
  healthMonitor,
  setupAutoRecovery,
  getSystemStatus
};
