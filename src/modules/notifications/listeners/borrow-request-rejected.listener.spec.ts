import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BorrowRequestRejectedListener } from './borrow-request-rejected.listener';
import { BorrowRequestRejectedEvent } from '../../../common/events/borrow-request-rejected.event';
import { EmailService } from '../../email/email.service';

describe('BorrowRequestRejectedListener', () => {
  let listener: BorrowRequestRejectedListener;
  let emailService: { sendMail: jest.Mock };

  beforeEach(async () => {
    emailService = { sendMail: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowRequestRejectedListener,
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    listener = module.get<BorrowRequestRejectedListener>(
      BorrowRequestRejectedListener,
    );
  });

  it('sends the rejection email to the request owner and includes the reason', async () => {
    const event = new BorrowRequestRejectedEvent(
      10,
      5,
      'jane@example.com',
      'Jane Doe',
      '2026-08-10',
      '2026-08-17',
      'Book damaged in a previous return',
    );

    await listener.handle(event);

    expect(emailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: expect.stringContaining('rejected'),
        html: expect.stringContaining('Book damaged in a previous return'),
      }),
    );
  });

  it('does not throw when the email fails to send', async () => {
    const loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    emailService.sendMail.mockRejectedValue(new Error('SMTP down'));

    await expect(
      listener.handle(
        new BorrowRequestRejectedEvent(
          10,
          5,
          'jane@example.com',
          'Jane Doe',
          '2026-08-10',
          '2026-08-17',
          'reason',
        ),
      ),
    ).resolves.toBeUndefined();

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('SMTP down'),
    );
    loggerErrorSpy.mockRestore();
  });
});
