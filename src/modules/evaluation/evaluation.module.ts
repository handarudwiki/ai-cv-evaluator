import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { EvaluationController } from "./evaluation.controller";
import { PrismaService } from "src/providers/prisma.service";
import { PdfService } from "src/providers/pdf.service";
import { PromptService } from "../llm/prompt.service";
import { RagService } from "../rag/rag.service";
import { EvaluationService } from "./evaluation.service";
import { LLMService } from "../llm/llm.service";
import { EmbeddingService } from "../rag/embedding.service";
import { EvaluationPromptProcessor } from "./evaluation.processor";

@Module({
    imports: [
        BullModule.registerQueue({
            connection:{
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT!) || 6379,
            },
            name: 'evaluation',
        })
    ],
    controllers: [EvaluationController  ],
    providers: [  
        PrismaService,
        PdfService,
        PromptService,
        RagService,
        EvaluationService,
        LLMService,
        EmbeddingService,
        EvaluationPromptProcessor
    ],
})

export class EvaluationModule {}