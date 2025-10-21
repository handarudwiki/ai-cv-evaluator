import { DocumentType } from "generated/prisma";

export interface CreateDocumentDto {
  fileName: string;
  filepath: string;
  type: DocumentType;
}