import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdir, rm, writeFile } from 'fs/promises';
import { SaveFileInput, StorageService } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') ?? 'uploads';
    this.appUrl = (
      this.configService.get<string>('APP_URL') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  async save({ buffer, originalName, folder }: SaveFileInput): Promise<string> {
    const filename = `${randomUUID()}${extname(originalName).toLowerCase()}`;
    const key = join(folder, filename);
    const destination = join(process.cwd(), this.uploadDir, key);

    await mkdir(join(process.cwd(), this.uploadDir, folder), {
      recursive: true,
    });
    await writeFile(destination, buffer);

    return key;
  }

  async remove(key: string): Promise<void> {
    const target = join(process.cwd(), this.uploadDir, key);

    try {
      await rm(target, { force: true });
    } catch (error) {
      this.logger.warn(
        `Failed to remove file "${key}": ${(error as Error).message}`,
      );
    }
  }

  getPublicUrl(key: string): string {
    return `${this.appUrl}/uploads/${key.split('\\').join('/')}`;
  }
}
