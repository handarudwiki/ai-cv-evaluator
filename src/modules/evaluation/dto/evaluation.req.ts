import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class EvaluationRequestDto{
    @IsString()
    @IsNotEmpty()
    jobTitle: string;

    @IsUUID()
    @IsNotEmpty()
    cvDocumentId: string;

    @IsUUID()
    @IsNotEmpty()
    reportDocumentId: string;
}