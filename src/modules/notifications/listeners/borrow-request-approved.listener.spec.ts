import { Test, TestingModule } from '@nestjs/testing';
import { BorrowRequestApprovedListener } from './borrow-request-approved.listener';
import { BorrowRequestApprovedEvent } from '../../../common/events/borrow-request-approved.event';
import { EmailService } from '../../email/email.service';

describe('BorrowRequestApprovedListener', () => {
  let listener: BorrowRequestApprovedListener;
  let emailService: { sendMail: jest.Mock };

  beforeEach(async () => {
    emailService = { sendMail: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowRequestApprovedListener,
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    listener = module.get<BorrowRequestApprovedListener>(
      BorrowRequestApprovedListener,
    );
  });

  it('sends the approval email to the request owner', async () => {
    const event = new BorrowRequestApprovedEvent(
      10,
      5,
      'jane@example.com',
      'Jane Doe',
      '2026-08-10',
      '2026-08-17',
      [{ title: 'Clean Code', quantity: 1 }],
    );

    await listener.handle(event);

    expect(emailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: expect.stringContaining('approved'),
        html: expect.stringContaining('Clean Code'),
      }),
    );
  });

  it('does not throw when the email fails to send', async () => {
    emailService.sendMail.mockRejectedValue(new Error('SMTP down'));

    await expect(
      listener.handle(
        new BorrowRequestApprovedEvent(
          10,
          5,
          'jane@example.com',
          'Jane Doe',
          '2026-08-10',
          '2026-08-17',
          [],
        ),
      ),
    ).resolves.toBeUndefined();
  });
});
