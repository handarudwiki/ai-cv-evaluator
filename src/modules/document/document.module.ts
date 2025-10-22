import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { PrismaService } from "src/providers/prisma.service";

@Module({
    imports: [
        MulterModule.register({
            dest: './uploads',
        }),
    ],
    controllers: [DocumentController],
    providers: [DocumentService, PrismaService],
    exports: [],
})

export class DocumentModule {}
