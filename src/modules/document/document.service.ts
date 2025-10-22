import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/providers/prisma.service";
import { CreateDocumentDto } from "./dto/upload_document.dto";

@Injectable()
export class DocumentService {
    private readonly logger = new Logger(DocumentService.name);

    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async create(dtos: CreateDocumentDto[]) {
       const documents = await Promise.all(
            dtos.map(dto =>
                this.prismaService.document.create({
                data: {
                    fileName: dto.fileName,
                    filePath: dto.filepath,
                    type: dto.type,
                },
                })
            )
        );

        dtos.forEach((dto, index) => {
            this.logger.log(`Document created:`, {
                fileName: dto.fileName,
                type: dto.type,
            });
        });

        return documents;
    }

    async findById(id: string) {
        const document = await this.prismaService.document.findUnique({
            where: { id },
        });

        if (!document) {
            this.logger.warn(`Document not found: ${id}`);
            throw new BadRequestException('Document not found');
        }

        this.logger.log(`Document retrieved: ${id}`);
        return document;
    }
}