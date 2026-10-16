import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

export type UploadedImage = {
  buffer: Buffer;
  size: number;
  mimetype: string;
};

type ImageType = {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
};

@Injectable()
export class R2StorageService {
  private readonly accountId: string;
  private readonly bucketName: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly endpoint: string;
  private client?: S3Client;

  constructor(private readonly config: ConfigService) {
    this.accountId = this.config.get<string>('r2.accountId') ?? '';
    this.bucketName = this.config.get<string>('r2.bucketName') ?? '';
    this.accessKeyId = this.config.get<string>('r2.accessKeyId') ?? '';
    this.secretAccessKey = this.config.get<string>('r2.secretAccessKey') ?? '';
    this.endpoint = this.config.get<string>('r2.endpoint') ?? '';
  }

  async uploadEventCover(eventId: string, file: UploadedImage) {
    if (file.size > 8 * 1024 * 1024)
      throw new BadRequestException({
        code: 'IMAGE_TOO_LARGE',
        message: 'La imagen no puede superar 8 MB.',
      });
    const type = this.imageType(file.buffer);
    if (!type)
      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'Sube una imagen JPG, PNG o WebP válida.',
      });

    const filename = `${randomUUID()}.${type.extension}`;
    try {
      await this.s3().send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: this.objectKey(eventId, filename),
          Body: file.buffer,
          ContentType: type.contentType,
          ContentLength: file.size,
        }),
      );
      return filename;
    } catch {
      throw new ServiceUnavailableException({
        code: 'STORAGE_UNAVAILABLE',
        message: 'No pudimos guardar la imagen. Inténtalo de nuevo.',
      });
    }
  }

  async readEventImage(eventId: string, filename: string) {
    try {
      const response = await this.s3().send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: this.objectKey(eventId, filename),
        }),
      );
      if (!response.Body)
        throw new ServiceUnavailableException({
          code: 'STORAGE_UNAVAILABLE',
          message: 'No pudimos leer la imagen.',
        });
      return {
        bytes: Buffer.from(await response.Body.transformToByteArray()),
        contentType: response.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException({
        code: 'STORAGE_UNAVAILABLE',
        message: 'No pudimos leer la imagen.',
      });
    }
  }

  async deleteEventImage(eventId: string, filename: string) {
    try {
      await this.s3().send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: this.objectKey(eventId, filename),
        }),
      );
    } catch {
      // A failed cleanup must not expose storage details or undo the event update.
    }
  }

  private s3() {
    if (!this.client) {
      if (
        !this.accountId ||
        !this.bucketName ||
        !this.accessKeyId ||
        !this.secretAccessKey ||
        !this.endpoint
      )
        throw new ServiceUnavailableException({
          code: 'STORAGE_UNAVAILABLE',
          message: 'El almacenamiento de imágenes no está configurado.',
        });
      this.client = new S3Client({
        endpoint: this.endpoint,
        region: 'auto',
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
    }
    return this.client;
  }

  private objectKey(eventId: string, filename: string) {
    return `events/${eventId}/${filename}`;
  }

  private imageType(buffer: Buffer): ImageType | null {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    )
      return { contentType: 'image/jpeg', extension: 'jpg' };
    if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    )
      return { contentType: 'image/png', extension: 'png' };
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).equals(Buffer.from('RIFF')) &&
      buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
    )
      return { contentType: 'image/webp', extension: 'webp' };
    return null;
  }
}
