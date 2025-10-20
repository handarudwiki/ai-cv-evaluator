import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { PrismaService } from "src/providers/prisma.service";
import { EvaluationRequestDto } from "./dto/evaluation.req";
import { EvaluationStatus } from "generated/prisma";

@Injectable()
export class EvaluationService {
    private readonly logger = new Logger(EvaluationService.name);

    constructor(
        @InjectQueue('evaluation') private readonly evaluationQueue: Queue,
        private prismaService: PrismaService
    ) {}

    async queueEvaluation(dto: EvaluationRequestDto) {
        const evaluationJob = await this.prismaService.evaluationJob.create({
            data: {
                jobTitle: dto.jobTitle,
                cvDocumentId: dto.cvDocumentId,
                reportDocumentId: dto.reportDocumentId,
                status: EvaluationStatus.QUEUED
            }
        })

        await this.evaluationQueue.add(
            'evaluate-candidate',
             {
                jobId: evaluationJob.id,
                jobTitle: dto.jobTitle,
                cvDocumentId: dto.cvDocumentId,
                reportDocumentId: dto.reportDocumentId
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000
                },
                removeOnComplete: true,
                removeOnFail: false
            }
        )

        this.logger.log(`Queued evaluation job with ID: ${evaluationJob.id}`);
        
        return evaluationJob;
    }

    async getEvaluationJobStatus(jobId: string) {
        const job = await this.prismaService.evaluationJob.findUnique({
            where: { id: jobId },
            include: {
                result: true
            }
        });

        if (!job) {
            throw new BadRequestException(`Evaluation job with ID ${jobId} not found`);
        }
        
    return job.status === EvaluationStatus.COMPLETED
    ? {
        id: job.id,
        status: job.status.toLowerCase(),
        result: job.result
            ? {
                cv_match_rate: job.result.cvMatchRate,
                cv_feedback: job.result.cvFeedback,
                project_score: job.result.projectScore,
                project_feedback: job.result.projectFeedback,
                overall_summary: job.result.overallSummary,
            }
            : null,
        }
    : {
        id: job.id,
        status: job.status.toLowerCase(),
        };

    }
}