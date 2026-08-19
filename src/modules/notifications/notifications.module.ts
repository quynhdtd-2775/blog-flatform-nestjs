import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { BorrowRequestApprovedListener } from './listeners/borrow-request-approved.listener';
import { BorrowRequestRejectedListener } from './listeners/borrow-request-rejected.listener';

@Module({
  imports: [EmailModule],
  providers: [BorrowRequestApprovedListener, BorrowRequestRejectedListener],
})
export class NotificationsModule {}
