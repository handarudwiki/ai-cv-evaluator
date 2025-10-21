import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileFieldsInterceptor, FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path/win32";
import { DocumentService } from "./document.service";
import { DocumentType } from "generated/prisma";

@Controller('documents')
export class DocumentController {
    constructor(private readonly documentService: DocumentService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'cv', maxCount: 1 },
                { name: 'project_report', maxCount: 1 },
            ]
            ,{
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
                    cb(null, filename);
                }
            }),
            limits: {
                fileSize: 10 * 1024 * 1024,
            },
            fileFilter: (req, file, cb) => {
                if (file.mimetype !== 'application/pdf') {
                    return cb(
                        new BadRequestException('Only PDF files are allowed'),
                        false
                    );
                }
                cb(null, true);
            }
        })
    )
    async uploadDocument(
        @UploadedFile() files: {
            cv?: Express.Multer.File[];
            project_report?: Express.Multer.File[];
        },
    ) {
        
        const cv = files.cv?.[0];
        const projectReport = files.project_report?.[0];

        if (!cv && !projectReport) {
            throw new BadRequestException('At least one file (CV or Project Report) must be uploaded');
        }

        const documents = this.documentService.create([
            {
                fileName : cv?.filename!,
                filepath: cv?.path!,
                type: DocumentType.CV,
            },
            {
                fileName: projectReport?.filename!,
                filepath: projectReport?.path!,
                type: DocumentType.PROJECT_REPORT,
            }
        ]);

        return documents
    }

    @Get(':id')
    async getDocumentById(@Param('id') id: string) {
        const document = await this.documentService.findById(id);
        return document;
    }
}