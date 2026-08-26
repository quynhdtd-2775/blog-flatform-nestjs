export interface SaveFileInput {
  buffer: Buffer;
  originalName: string;
  folder: string;
}

export abstract class StorageService {
  abstract save(input: SaveFileInput): Promise<string>;
  abstract remove(key: string): Promise<void>;
  abstract getPublicUrl(key: string): string;
}
