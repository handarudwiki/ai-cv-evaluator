export class EvaluationResultDto {
  cv_match_rate: number;
  cv_feedback: string;
  project_score: number;
  project_feedback: string;
  overall_summary: string;
}

export class EvaluationStatusDto {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: EvaluationResultDto;
  error?: string;
}