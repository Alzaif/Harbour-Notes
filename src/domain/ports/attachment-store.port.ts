import type { Attachment } from '../entities/attachment.js';

export interface AttachmentStorePort {
  create(params: {
    ownerUserId: string;
    pageId: string;
    mimeType: string;
    originalFilename: string;
    data: Buffer;
  }): Promise<Attachment>;
  findById(ownerUserId: string, id: string): Promise<Attachment | null>;
  readContent(ownerUserId: string, id: string): Promise<Buffer | null>;
  deleteByPage(ownerUserId: string, pageId: string): Promise<void>;
  delete(ownerUserId: string, id: string): Promise<void>;
}
