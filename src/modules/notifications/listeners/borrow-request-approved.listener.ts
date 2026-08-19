import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '../../../common/events/event-names';
import { BorrowRequestApprovedEvent } from '../../../common/events/borrow-request-approved.event';
import { EmailService } from '../../email/email.service';
import {
  BORROW_REQUEST_APPROVED_SUBJECT,
  buildBorrowRequestApprovedEmail,
} from '../templates/email-templates';

@Injectable()
export class BorrowRequestApprovedListener {
  private readonly logger = new Logger(BorrowRequestApprovedListener.name);

  constructor(private readonly emailService: EmailService) {}

  @OnEvent(EVENT_NAMES.BORROW_REQUEST_APPROVED)
  async handle(event: BorrowRequestApprovedEvent): Promise<void> {
    this.logger.log(
      `Sending borrow approval email to user ${event.userId} for request #${event.borrowRequestId}`,
    );

    try {
      await this.emailService.sendMail({
        to: event.userEmail,
        subject: BORROW_REQUEST_APPROVED_SUBJECT,
        html: buildBorrowRequestApprovedEmail({
          name: event.userName,
          borrowRequestId: event.borrowRequestId,
          fromDate: event.fromDate,
          toDate: event.toDate,
          books: event.books,
        }),
      });

      this.logger.log(
        `Borrow approval email sent successfully for request #${event.borrowRequestId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send borrow approval email for request #${event.borrowRequestId}: ${(error as Error).message}`,
      );
    }
  }
}
