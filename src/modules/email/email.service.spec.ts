import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: { get: jest.Mock };
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue(undefined);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          MAIL_FROM: 'library@example.com',
          MAIL_HOST: 'smtp.example.com',
          MAIL_PORT: 587,
          MAIL_USER: 'user',
          MAIL_PASSWORD: 'pass',
        };
        return values[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates the transporter from MAIL_* configuration', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'user', pass: 'pass' },
    });
  });

  it('sends mail using the configured from address', async () => {
    await service.sendMail({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'library@example.com',
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });
  });

  it('propagates errors from the underlying transporter', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(
      service.sendMail({ to: 'user@example.com', subject: 'Hi', html: '' }),
    ).rejects.toThrow('SMTP down');
  });

  it('omits auth when MAIL_USER/MAIL_PASSWORD are not configured (e.g. local SMTP catcher)', () => {
    configService.get.mockImplementation(
      (key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          MAIL_FROM: 'library@example.com',
          MAIL_HOST: 'localhost',
          MAIL_PORT: 1025,
        };
        return values[key] ?? defaultValue;
      },
    );

    service.onModuleInit();

    expect(nodemailer.createTransport).toHaveBeenLastCalledWith({
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: undefined,
    });
  });
});
