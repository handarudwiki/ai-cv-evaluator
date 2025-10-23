import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { PrismaService } from "src/providers/prisma.service";
import { LLMService } from "../llm/llm.service";
import { RagService } from "../rag/rag.service";
import { PromptService } from "../llm/prompt.service";
import { PdfService } from "src/providers/pdf.service";
import { Job } from "bullmq";
import { DocumentType, EvaluationStatus } from "generated/prisma";
import { calculateCVMatchRate, calculateProjectScore } from "src/common/util/scoring.util";
import { EvaluationJobData } from "./evaluation.service";

interface CVEvaluation {
    technical_skills: number;
    experience_level: number;
    relevant_achievements: number;
    cultural_fit: number;
    feedback: string;
}

interface ProjectEvaluation {
    correctness: number;
    code_quality: number;
    resilience: number;
    documentation: number;
    creativity: number;
    feedback: string;
}

@Processor('evaluation')
export class EvaluationPromptProcessor extends WorkerHost{
    private readonly logger = new Logger(EvaluationPromptProcessor.name);

    constructor(
        private prismaService: PrismaService,
        private llmService: LLMService,
        private ragService: RagService,
        private prompService: PromptService,
        private pdfService: PdfService
    ) {
        super();
    }

    async process(job: Job<EvaluationJobData>) {
        this.logger.log(`Processing evaluation job ID: ${job.data.jobId}`);

        try {
            await this.updateJobStatus(job.data.jobId, EvaluationStatus.PROCESSING);

            // Parse PDF documents
            const [cvDocument, reportDocument] = await Promise.all([
                this.prismaService.document.findUnique({ where: { id: job.data.cvDocumentId } }),
                this.prismaService.document.findUnique({ where: { id: job.data.reportDocumentId } }),
            ]);

            if (!cvDocument || !reportDocument) {
                throw new Error('CV or Report document not found');
            }

            const [cvStructure, reportText] = await Promise.all([
                this.pdfService.extractCvStructure(cvDocument.filePath),
                this.pdfService.extractText(reportDocument.filePath),
            ]);

            this.logger.log(`Extracted CV and Report texts. CV length: ${cvStructure.text.length}, Report length: ${reportText.length}`);


            // Cv evaluation with RAG
            const cvEvaluation = await this.evaluateCV(cvStructure.text, job.data.jobTitle);
            this.logger.log('Completed CV evaluation');

            // Project evaluation with RAG
            const projectEvaluation = await this.evaluateProject(reportText, job.data.jobTitle);
            this.logger.log('Completed Project evaluation');

            // Final summary
            const overall_summary = await this.generateFinalSummary(cvEvaluation, projectEvaluation, job.data.jobTitle);
            this.logger.log('Generated final summary for evaluation');

            // Aggregate results
            const result = {
                cv_match_rate: calculateCVMatchRate({
                    Technical_skills: cvEvaluation.technical_skills,
                    Experience_level: cvEvaluation.experience_level,
                    Relevant_achievements: cvEvaluation.relevant_achievements,
                    Cultural_fit: cvEvaluation.cultural_fit,
                }),
                cv_feedback: cvEvaluation.feedback,
                project_score: calculateProjectScore({
                    correctness: projectEvaluation.correctness,
                    codeQuality: projectEvaluation.code_quality,
                    resilience: projectEvaluation.resilience,
                    documentation: projectEvaluation.documentation,
                    creativity: projectEvaluation.creativity,
                }),
                project_feedback: projectEvaluation.feedback,
                overall_summary: overall_summary
            }

            const newResult = await this.prismaService.result.create({
                data: {
                    cvMatchRate: result.cv_match_rate,
                    cvFeedback: result.cv_feedback,
                    projectScore: result.project_score,
                    projectFeedback: result.project_feedback,
                    overallSummary: result.overall_summary,
                }
            })

            await this.prismaService.evaluationJob.update({
                where: { id: job.data.jobId },
                data: {
                    status: EvaluationStatus.COMPLETED,
                    resultId: newResult.id
                }
            });
          
            this.logger.log(`Evaluation job ID: ${job.data.jobId} completed successfully`);
        
            return result;
        } catch (error) {
            await this.updateJobStatus(job.data.jobId, EvaluationStatus.FAILED);
            this.logger.error(`Failed to process evaluation job ID: ${job.data.jobId}. Error: ${error.message}`);
            throw error;
        }
    }

    private async generateFinalSummary(
        cvEval: CVEvaluation,
        projectEval: ProjectEvaluation,
        jobTitle: string
    ): Promise<string> {
        const summary = await this.llmService.callWithRetry<string>(
            {
                systemPrompt: this.prompService.getFinalSummarySystemPrompt(),
                userPrompt: this.prompService.buildFinalSummaryUserPrompt(cvEval, projectEval, jobTitle),
                temperature: 0.4,
                responseFormat: 'text'
            },
        (response) => response.trim()
        )

        return summary;
    }

    private async evaluateProject(reportText: string, jobTitle: string): Promise<ProjectEvaluation> {
        const jobContext = await this.ragService.retrieveContext(
            `${jobTitle}`,
            [DocumentType.CASE_STUDY, DocumentType.PROJECT_RUBRIC],
            5
        )

        this.logger.log('Retrieved job context for Project evaluation');

        const evaluation = await this.llmService.callWithRetry<ProjectEvaluation>(
            {
                systemPrompt: this.prompService.getProjectEvaluationSystemPrompt(),
                userPrompt: this.prompService.buildProjectEvaluationUserPrompt(reportText, jobContext),
                temperature: 0.3,
                responseFormat: 'json'
            },
        (response) => this.parseProjectEvaluation(response)
        )

        return evaluation;
    }

    private parseProjectEvaluation(response: string): ProjectEvaluation {
        try {
            const data = JSON.parse(response);

            const required = [
                'correctness',
                'code_quality',
                'resilience',
                'documentation',
                'creativity',
                'feedback'
            ];

            for (const key of required) {
                if (!(key in data)) {
                    throw new Error(`Missing required field: ${key}`);
                }
            }

            return {
                correctness: data.correctness,
                code_quality: data.code_quality,
                resilience: data.resilience,
                documentation: data.documentation,
                creativity: data.creativity,
                feedback: data.feedback
            };

        } catch (error) {
            this.logger.error(`Failed to parse Project evaluation response: ${error.message}`);
            throw error;
        }
    }

    private async evaluateCV(cvText: string, jobTitle: string): Promise<CVEvaluation> {
        const jobContext = await this.ragService.retrieveContext(
            `${jobTitle}`,
            [DocumentType.JOB_DESCRIPTION, DocumentType.CV_RUBRIC]
        )

        this.logger.log('Retrieved job context for CV evaluation');

        const evaluation = await this.llmService.callWithRetry<CVEvaluation>(
            {
                systemPrompt: this.prompService.getCvEvaluationSystemPrompt(),
                userPrompt: this.prompService.buildCvEvaluationUserPrompt(cvText, jobContext, jobTitle),
                temperature: 0.3,
                responseFormat: 'json'
            },
        (response) => this.parseCVEvaluation(response)
        )

        return evaluation;
    }

    private parseCVEvaluation(response: string): CVEvaluation {
        try {
            const data = JSON.parse(response);

            const required = [
                'technical_skills',
                'experience_level',
                'relevant_achievements',
                'cultural_fit',
                'feedback'
            ];

            for (const key of required) {
                if (!(key in data)) {
                    throw new Error(`Missing required field: ${key}`);
                }
            }

            return {
                technical_skills: data.technical_skills,
                experience_level: data.experience_level,
                relevant_achievements: data.relevant_achievements,
                cultural_fit: data.cultural_fit,
                feedback: data.feedback
            };

        } catch (error) {
            this.logger.error(`Failed to parse CV evaluation response: ${error.message}`);
            throw error;
        }
    }

    private async updateJobStatus(jobId: string, status: EvaluationStatus) {
        await this.prismaService.evaluationJob.update({
            where: { id: jobId },
            data: { status }
        });
    }


}