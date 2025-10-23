import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface NotificationRecipient {
  user_ids: string[];
}

@Injectable()
export class NotificationHelperService {
  private readonly logger = new Logger(NotificationHelperService.name);
  private readonly authServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.authServiceUrl = 
      this.configService.get<string>('AUTH_SERVICE_URL') || 
      'http://auth-service:8001';
  }

  /**
   * Get users by role from auth service
   */
  async getUsersByRole(role: string, authToken: string): Promise<string[]> {
    try {
      const url = `${this.authServiceUrl}/api/v1/users/`;
      const params = { role, status: 'active', limit: 1000 };
      
      this.logger.log(`Fetching users with role '${role}' from ${url}`);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        params,
        timeout: 10000,
      });

      if (response.status === 200) {
        const users = response.data;
        const userIds = users.map((user: any) => user._id || user.id).filter(Boolean);
        this.logger.log(`Found ${userIds.length} users with role '${role}'`);
        return userIds;
      } else {
        this.logger.error(`Failed to fetch users with role '${role}': ${response.status}`);
        return [];
      }
    } catch (error) {
      this.logger.error(`Error fetching users by role '${role}': ${error.message}`);
      return [];
    }
  }

  /**
   * Get notification recipients for inventory actions
   * Returns superadmins, admins, and managers (excluding the performer)
   */
  async getInventoryNotificationRecipients(
    performerId: string,
    authToken: string,
    includeManagers: boolean = true,
  ): Promise<string[]> {
    const recipients = new Set<string>();

    try {
      // Get super admins (always notified)
      const superAdmins = await this.getUsersByRole('super_admin', authToken);
      superAdmins.forEach(id => recipients.add(id));

      // Get admins (always notified for inventory actions)
      const admins = await this.getUsersByRole('admin', authToken);
      admins.forEach(id => recipients.add(id));

      // Get managers if requested
      if (includeManagers) {
        const managers = await this.getUsersByRole('manager', authToken);
        managers.forEach(id => recipients.add(id));
      }

      // Remove the performer from recipients
      if (performerId) {
        recipients.delete(performerId);
      }

      const recipientArray = Array.from(recipients);
      this.logger.log(
        `Notification recipients for inventory action: ${recipientArray.length} users (performer ${performerId} excluded)`,
      );

      return recipientArray;
    } catch (error) {
      this.logger.error(`Error getting inventory notification recipients: ${error.message}`);
      return [];
    }
  }

  /**
   * Get user info from auth service
   */
  async getUserInfo(userId: string, authToken: string): Promise<any> {
    try {
      const url = `${this.authServiceUrl}/api/v1/users/${userId}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 5000,
      });

      if (response.status === 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error fetching user info for ${userId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get performer name for notifications
   */
  async getPerformerName(performerId: string, authToken: string): Promise<string> {
    try {
      const userInfo = await this.getUserInfo(performerId, authToken);
      if (userInfo) {
        const firstName = userInfo.first_name || '';
        const lastName = userInfo.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || userInfo.email || 'A user';
      }
      return 'A user';
    } catch (error) {
      this.logger.error(`Error getting performer name: ${error.message}`);
      return 'A user';
    }
  }
}

