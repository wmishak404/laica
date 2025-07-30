// Usage tracking and analytics for cost monitoring
export interface UsageStats {
  totalTranscriptions: number;
  totalAudioMinutes: number;
  totalCost: number;
  dailyUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
  lastResetDate: string;
}

export interface UsageLimits {
  dailyMinutes: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
  maxCostPerDay: number;
  maxCostPerWeek: number;
  maxCostPerMonth: number;
}

export class UsageTracker {
  private static readonly STORAGE_KEY = 'laica_voice_usage';
  private static readonly WHISPER_COST_PER_MINUTE = 0.006; // $0.006 per minute
  
  // Default limits for demo users
  private static readonly DEFAULT_LIMITS: UsageLimits = {
    dailyMinutes: 10,      // 10 minutes per day
    weeklyMinutes: 50,     // 50 minutes per week  
    monthlyMinutes: 200,   // 200 minutes per month
    maxCostPerDay: 0.06,   // $0.06 per day
    maxCostPerWeek: 0.30,  // $0.30 per week
    maxCostPerMonth: 1.20  // $1.20 per month
  };
  
  /**
   * Get current usage statistics
   */
  static getUsageStats(): UsageStats {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return this.createNewUsageStats();
    }
    
    try {
      const stats = JSON.parse(stored);
      
      // Reset counters if needed
      const now = new Date();
      const lastReset = new Date(stats.lastResetDate);
      
      if (this.shouldResetCounters(now, lastReset)) {
        return this.resetCounters(stats, now);
      }
      
      return stats;
    } catch (error) {
      console.warn('Failed to parse usage stats, creating new:', error);
      return this.createNewUsageStats();
    }
  }
  
  /**
   * Record a new transcription usage
   */
  static recordUsage(durationSeconds: number, compressionRatio: number = 1): UsageStats {
    const stats = this.getUsageStats();
    const durationMinutes = durationSeconds / 60;
    const cost = durationMinutes * this.WHISPER_COST_PER_MINUTE;
    
    stats.totalTranscriptions += 1;
    stats.totalAudioMinutes += durationMinutes;
    stats.totalCost += cost;
    stats.dailyUsage += durationMinutes;
    stats.weeklyUsage += durationMinutes;
    stats.monthlyUsage += durationMinutes;
    
    this.saveUsageStats(stats);
    
    console.log('Usage recorded:', {
      duration: `${durationSeconds.toFixed(1)}s`,
      cost: `$${cost.toFixed(4)}`,
      compressionRatio: `${compressionRatio.toFixed(2)}x`,
      dailyUsage: `${stats.dailyUsage.toFixed(2)} min`,
      weeklyUsage: `${stats.weeklyUsage.toFixed(2)} min`,
      monthlyUsage: `${stats.monthlyUsage.toFixed(2)} min`
    });
    
    return stats;
  }
  
  /**
   * Check if usage is within limits
   */
  static checkUsageLimits(): {
    withinLimits: boolean;
    limitsExceeded: string[];
    remainingUsage: {
      dailyMinutes: number;
      weeklyMinutes: number;
      monthlyMinutes: number;
    };
    warnings: string[];
  } {
    const stats = this.getUsageStats();
    const limits = this.DEFAULT_LIMITS;
    
    const limitsExceeded: string[] = [];
    const warnings: string[] = [];
    
    // Check daily limits
    if (stats.dailyUsage >= limits.dailyMinutes) {
      limitsExceeded.push('daily minutes');
    } else if (stats.dailyUsage >= limits.dailyMinutes * 0.8) {
      warnings.push(`Daily usage at ${((stats.dailyUsage / limits.dailyMinutes) * 100).toFixed(0)}%`);
    }
    
    // Check weekly limits
    if (stats.weeklyUsage >= limits.weeklyMinutes) {
      limitsExceeded.push('weekly minutes');
    } else if (stats.weeklyUsage >= limits.weeklyMinutes * 0.8) {
      warnings.push(`Weekly usage at ${((stats.weeklyUsage / limits.weeklyMinutes) * 100).toFixed(0)}%`);
    }
    
    // Check monthly limits
    if (stats.monthlyUsage >= limits.monthlyMinutes) {
      limitsExceeded.push('monthly minutes');
    } else if (stats.monthlyUsage >= limits.monthlyMinutes * 0.8) {
      warnings.push(`Monthly usage at ${((stats.monthlyUsage / limits.monthlyMinutes) * 100).toFixed(0)}%`);
    }
    
    return {
      withinLimits: limitsExceeded.length === 0,
      limitsExceeded,
      remainingUsage: {
        dailyMinutes: Math.max(0, limits.dailyMinutes - stats.dailyUsage),
        weeklyMinutes: Math.max(0, limits.weeklyMinutes - stats.weeklyUsage),
        monthlyMinutes: Math.max(0, limits.monthlyMinutes - stats.monthlyUsage)
      },
      warnings
    };
  }
  
  /**
   * Get usage limits
   */
  static getUsageLimits(): UsageLimits {
    return { ...this.DEFAULT_LIMITS };
  }
  
  /**
   * Reset usage statistics (admin function)
   */
  static resetUsage(): UsageStats {
    const stats = this.createNewUsageStats();
    this.saveUsageStats(stats);
    return stats;
  }
  
  /**
   * Export usage data for analytics
   */
  static exportUsageData(): string {
    const stats = this.getUsageStats();
    const limits = this.getUsageLimits();
    
    return JSON.stringify({
      stats,
      limits,
      exportDate: new Date().toISOString(),
      costEfficiency: {
        averageCostPerTranscription: stats.totalTranscriptions > 0 ? stats.totalCost / stats.totalTranscriptions : 0,
        averageDurationPerTranscription: stats.totalTranscriptions > 0 ? stats.totalAudioMinutes / stats.totalTranscriptions : 0
      }
    }, null, 2);
  }
  
  // Private helper methods
  
  private static createNewUsageStats(): UsageStats {
    return {
      totalTranscriptions: 0,
      totalAudioMinutes: 0,
      totalCost: 0,
      dailyUsage: 0,
      weeklyUsage: 0,
      monthlyUsage: 0,
      lastResetDate: new Date().toISOString()
    };
  }
  
  private static saveUsageStats(stats: UsageStats): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save usage stats:', error);
    }
  }
  
  private static shouldResetCounters(now: Date, lastReset: Date): boolean {
    // Reset daily counters
    if (now.toDateString() !== lastReset.toDateString()) {
      return true;
    }
    
    return false;
  }
  
  private static resetCounters(stats: UsageStats, now: Date): UsageStats {
    const lastReset = new Date(stats.lastResetDate);
    
    // Reset daily counter if it's a new day
    if (now.toDateString() !== lastReset.toDateString()) {
      stats.dailyUsage = 0;
    }
    
    // Reset weekly counter if it's a new week (Monday)
    const nowWeek = this.getWeekNumber(now);
    const lastResetWeek = this.getWeekNumber(lastReset);
    if (nowWeek !== lastResetWeek) {
      stats.weeklyUsage = 0;
    }
    
    // Reset monthly counter if it's a new month
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      stats.monthlyUsage = 0;
    }
    
    stats.lastResetDate = now.toISOString();
    this.saveUsageStats(stats);
    
    return stats;
  }
  
  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}