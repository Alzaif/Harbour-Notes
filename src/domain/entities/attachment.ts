export interface Attachment {
  readonly id: string;
  readonly ownerUserId: string;
  readonly pageId: string;
  readonly storageKey: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly originalFilename: string;
  readonly createdAt: Date;
}
