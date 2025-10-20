import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { EvaluationRequestDto } from "./dto/evaluation.req";
import { EvaluationService } from "./evaluation.service";

@Controller('evaluate')
export class EvaluationController {
    constructor(private readonly evaluationService: EvaluationService) {}
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async evaluateCandidate(@Body() dto:EvaluationRequestDto) {
        const evaluationJob = await this.evaluationService.queueEvaluation(dto);
        return evaluationJob;
    }

    @Get('result/:id')
    async getEvaluationResult(@Param('id') id: string) {
        const result = await this.evaluationService.getEvaluationJobStatus(id);
        return result;
    }
}