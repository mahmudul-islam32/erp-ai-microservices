import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  action_url?: string;
  action_label?: string;
}

@Injectable()
export class NotificationClientService {
  private readonly logger = new Logger(NotificationClientService.name);
  private readonly notificationServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.notificationServiceUrl = 
      this.configService.get<string>('NOTIFICATION_SERVICE_URL') || 
      'http://notification-service:8004';
  }

  async sendNotification(
    payload: NotificationPayload,
    authToken?: string,
  ): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Build payload matching Python NotificationCreate model exactly
      const requestBody = {
        user_id: payload.user_id,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'custom',
        priority: payload.priority || 'medium',
        metadata: payload.metadata || {},  // Ensure metadata is an object, not undefined
        action_url: payload.action_url || null,  // Use null instead of undefined
        action_label: payload.action_label || null,  // Use null instead of undefined
      };

      this.logger.log(`📤 Sending notification to ${payload.user_id}: ${payload.title}`);
      this.logger.debug(`Request body: ${JSON.stringify(requestBody)}`);

      const response = await axios.post(
        `${this.notificationServiceUrl}/api/v1/notifications/`,
        requestBody,
        {
          headers,
          timeout: 5000,
        },
      );

      if (response.status === 201) {
        this.logger.log(
          `✅ Notification sent successfully to user ${payload.user_id}`,
        );
        return true;
      } else {
        this.logger.error(`❌ Failed to send notification: ${response.status}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ Error sending notification: ${error.message}`);
      if (error.response) {
        this.logger.error(`   Response status: ${error.response.status}`);
        this.logger.error(`   Response data: ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }

  async sendBulkNotification(
    userIds: string[],
    title: string,
    message: string,
    type: string = 'system_alert',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    metadata?: Record<string, any>,
    authToken?: string,
  ): Promise<number> {
    let successCount = 0;

    for (const userId of userIds) {
      const success = await this.sendNotification(
        {
          user_id: userId,
          title,
          message,
          type,
          priority,
          metadata,
        },
        authToken,
      );

      if (success) {
        successCount++;
      }
    }

    return successCount;
  }
}

