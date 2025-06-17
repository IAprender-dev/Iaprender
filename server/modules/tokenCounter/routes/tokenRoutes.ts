import type { Express, Request, Response } from "express";
import { storage } from "../../../storage";

interface TokenStatus {
  canProceed: boolean;
  currentUsage: number;
  monthlyLimit: number;
  remainingTokens: number;
  resetDate: string;
  warningThreshold: boolean;
  stats: {
    totalUsage: number;
    dailyUsage: number;
    weeklyUsage: number;
    monthlyUsage: number;
    averageDailyUsage: number;
  };
}

interface TokenUsageHistory {
  id: number;
  provider: string;
  model: string;
  tokensUsed: number;
  cost: number;
  timestamp: string;
  requestType: string;
}

interface TokenAlert {
  id: number;
  type: 'warning' | 'limit_exceeded' | 'cost_threshold';
  message: string;
  timestamp: string;
  isRead: boolean;
}

const authenticate = (req: Request, res: Response, next: Function) => {
  // For development, allow access - in production this should check authentication
  next();
};

export function registerTokenRoutes(app: Express) {
  // Get token status for current user
  app.get('/api/tokens/status', authenticate, async (req: Request, res: Response) => {
    try {
      // Mock data - in production this would come from database/service
      const currentDate = new Date();
      const resetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      
      const mockStatus: TokenStatus = {
        canProceed: true,
        currentUsage: 15750,
        monthlyLimit: 50000,
        remainingTokens: 34250,
        resetDate: resetDate.toISOString(),
        warningThreshold: false,
        stats: {
          totalUsage: 125000,
          dailyUsage: 2500,
          weeklyUsage: 15750,
          monthlyUsage: 15750,
          averageDailyUsage: 2100
        }
      };

      // Calculate warning threshold (85% of limit)
      mockStatus.warningThreshold = mockStatus.currentUsage >= (mockStatus.monthlyLimit * 0.85);
      mockStatus.canProceed = mockStatus.currentUsage < mockStatus.monthlyLimit;

      res.json(mockStatus);
    } catch (error) {
      console.error('Error getting token status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get token usage history
  app.get('/api/tokens/usage-history', authenticate, async (req: Request, res: Response) => {
    try {
      // Mock data - in production this would come from database
      const mockHistory: TokenUsageHistory[] = [
        {
          id: 1,
          provider: 'OpenAI',
          model: 'gpt-4o',
          tokensUsed: 1250,
          cost: 0.0375,
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
          requestType: 'chat_completion'
        },
        {
          id: 2,
          provider: 'Anthropic',
          model: 'claude-sonnet-4',
          tokensUsed: 890,
          cost: 0.0267,
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          requestType: 'message'
        },
        {
          id: 3,
          provider: 'OpenAI',
          model: 'whisper-1',
          tokensUsed: 450,
          cost: 0.0054,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          requestType: 'transcription'
        },
        {
          id: 4,
          provider: 'Anthropic',
          model: 'claude-sonnet-4',
          tokensUsed: 1100,
          cost: 0.033,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
          requestType: 'message'
        },
        {
          id: 5,
          provider: 'OpenAI',
          model: 'gpt-4o',
          tokensUsed: 750,
          cost: 0.0225,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          requestType: 'chat_completion'
        }
      ];

      res.json(mockHistory);
    } catch (error) {
      console.error('Error getting usage history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get token alerts
  app.get('/api/tokens/alerts', authenticate, async (req: Request, res: Response) => {
    try {
      // Mock data - in production this would come from database
      const mockAlerts: TokenAlert[] = [
        {
          id: 1,
          type: 'warning',
          message: 'Você utilizou 75% do seu limite mensal de tokens. Considere monitorar o uso.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          isRead: false
        }
      ];

      res.json(mockAlerts);
    } catch (error) {
      console.error('Error getting token alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Mark alerts as read
  app.post('/api/tokens/alerts/:id/read', authenticate, async (req: Request, res: Response) => {
    try {
      const alertId = parseInt(req.params.id);
      
      // Mock implementation - in production this would update database
      res.json({ success: true, message: 'Alert marked as read' });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get token limits configuration
  app.get('/api/tokens/limits', authenticate, async (req: Request, res: Response) => {
    try {
      // Mock data - in production this would come from database/config
      const mockLimits = {
        monthlyTokenLimit: 50000,
        dailyTokenLimit: 2000,
        warningThreshold: 85, // percentage
        costThreshold: 100.00, // in currency
        providers: {
          openai: {
            enabled: true,
            models: ['gpt-4o', 'gpt-4o-mini', 'whisper-1'],
            rateLimit: 60 // requests per minute
          },
          anthropic: {
            enabled: true,
            models: ['claude-sonnet-4', 'claude-haiku-3'],
            rateLimit: 40
          },
          perplexity: {
            enabled: true,
            models: ['sonar-small', 'sonar-medium'],
            rateLimit: 30
          }
        }
      };

      res.json(mockLimits);
    } catch (error) {
      console.error('Error getting token limits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update token limits (admin only)
  app.put('/api/tokens/limits', authenticate, async (req: Request, res: Response) => {
    try {
      // Mock implementation - in production this would update database
      const updates = req.body;
      
      res.json({ 
        success: true, 
        message: 'Token limits updated successfully',
        data: updates
      });
    } catch (error) {
      console.error('Error updating token limits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}