import { Module, Global } from '@nestjs/common';
import { NotificationClientService } from './notification-client.service';
import { NotificationHelperService } from './notification-helper.service';

@Global()
@Module({
  providers: [NotificationClientService, NotificationHelperService],
  exports: [NotificationClientService, NotificationHelperService],
})
export class CommonModule {}

