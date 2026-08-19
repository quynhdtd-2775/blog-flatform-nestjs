import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '../../../common/events/event-names';
import { BorrowRequestRejectedEvent } from '../../../common/events/borrow-request-rejected.event';
import { EmailService } from '../../email/email.service';
import {
  BORROW_REQUEST_REJECTED_SUBJECT,
  buildBorrowRequestRejectedEmail,
} from '../templates/email-templates';

@Injectable()
export class BorrowRequestRejectedListener {
  private readonly logger = new Logger(BorrowRequestRejectedListener.name);

  constructor(private readonly emailService: EmailService) {}

  @OnEvent(EVENT_NAMES.BORROW_REQUEST_REJECTED)
  async handle(event: BorrowRequestRejectedEvent): Promise<void> {
    this.logger.log(
      `Sending borrow rejection email to user ${event.userId} for request #${event.borrowRequestId}`,
    );

    try {
      await this.emailService.sendMail({
        to: event.userEmail,
        subject: BORROW_REQUEST_REJECTED_SUBJECT,
        html: buildBorrowRequestRejectedEmail({
          name: event.userName,
          borrowRequestId: event.borrowRequestId,
          fromDate: event.fromDate,
          toDate: event.toDate,
          rejectReason: event.rejectReason,
        }),
      });

      this.logger.log(
        `Borrow rejection email sent successfully for request #${event.borrowRequestId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send borrow rejection email for request #${event.borrowRequestId}: ${(error as Error).message}`,
      );
    }
  }
}
