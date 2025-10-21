import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { DocumentController } from "./document.controller";

@Module({
    imports: [
        MulterModule.register({
            dest: './uploads',
        }),
    ],
    controllers: [DocumentController],
    providers: [],
    exports: [],
})

export class DocumentModule {}
