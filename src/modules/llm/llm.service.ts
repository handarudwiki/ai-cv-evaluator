import { GenerativeModel, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { Injectable, Logger } from "@nestjs/common";

export interface LLMCallOptions {
    systemPrompt?: string;
    userPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json';
}

interface GeminiUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

@Injectable()
export class LLMService {
    private readonly logger = new Logger(LLMService.name);
    private readonly genai: GoogleGenerativeAI;
    private readonly MAX_RETRIES = 3;
    private readonly TIMEOUT_MS = 10000;
    private readonly RETRY_DELAY_MS = 1000;

    constructor() {
        this.genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')
    }

    async callWithRetry<T>(
        options: LLMCallOptions,
        parseResponse: (response: string) => T
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                this.logger.log(`Attempt ${attempt}/${this.MAX_RETRIES} to call LLM`);

                const startTime = Date.now();

                const model = await this.genai.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    generationConfig: {
                        maxOutputTokens: options.maxTokens ?? 2500,
                        temperature: options.temperature ?? 0.3,
                        ...(options.responseFormat === 'json' && {
                            responseFormat: { type: 'json' }
                        })
                    },
                    safetySettings: [
                        {
                            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                            threshold: HarmBlockThreshold.BLOCK_NONE,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                            threshold: HarmBlockThreshold.BLOCK_NONE,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                            threshold: HarmBlockThreshold.BLOCK_NONE,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                            threshold: HarmBlockThreshold.BLOCK_NONE,
                        },
                    ]

                })

                const fullPrompt = this.buildFullPrompt(options.systemPrompt || '', options.userPrompt || '');

                const resultPromise = model.generateContent(fullPrompt);
                const result = await this.withTimeout(resultPromise, this.TIMEOUT_MS);

                const duration = Date.now() - startTime;
                
                const responseText = result.response;
                const content = responseText.text();

                if (!content) {
                    throw new Error('Received empty response from LLM');
                }

                const parsed = parseResponse(content);

                const usage = this.extractUsage(result);

                this.logger.log("LLM call successful", {
                    attempt,
                    duration: `${duration}ms`,
                    tokens: usage.totalTokens,
                    promptTokens: usage.promptTokens,
                    completionTokens: usage.completionTokens,
                });

                return parsed;
            } catch (error) {
                lastError = error as Error;

                this.logger.warn(`LLM call failed on attempt ${attempt}: ${lastError.message}`);

                // handle rate limits
                if (this.isRateLimitError(lastError)) {
                    const waitTime = this.exponentialBackoff(attempt);
                    this.logger.warn(`Rate limit encountered. Retrying after ${waitTime}ms...`);

                    if (attempt < this.MAX_RETRIES) {
                        await this.sleep(waitTime);
                        continue;
                    }
                }

                // handle timeouts
                if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
                    this.logger.warn(`Timeout encountered. Retrying...`);
                    if (attempt < this.MAX_RETRIES) {
                        const waitTime = this.exponentialBackoff(attempt);
                        await this.sleep(waitTime);
                        continue;
                    }
                }

                // handle server errors
                if (this.isServerError(lastError)) {
                    this.logger.warn(`Server error encountered. Retrying...`);
                    if (attempt < this.MAX_RETRIES) {
                        const waitTime = this.exponentialBackoff(attempt);
                        await this.sleep(waitTime);
                        continue;
                    }
                }

                // handle client errors - do not retry
                if (this.isCLientError(lastError)) {
                    this.logger.error(`Client error encountered. Not retrying.`);
                    break;
                }

                // handle safety block errors - do not retry
                if (this.isSafetyBlockError(lastError)) {
                    this.logger.error(`Safety block error encountered. Not retrying.`);
                    break;
                }

                if( attempt < this.MAX_RETRIES ) {
                    const waitTime = this.exponentialBackoff(attempt);
                    this.logger.warn(`Unknown error encountered. Retrying after ${waitTime}ms...`);
                    await this.sleep(waitTime);
                    continue;
                }
            }
        }

        this.logger.error('All LLM call attempts failed', { error: lastError?.message });
        throw lastError ?? new Error('LLM call failed after all retries');
    }

    private buildFullPrompt(systemPrompt: string, userPrompt: string): string {
        return `${systemPrompt}\n---\n${userPrompt}`;
    }

    private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
            ),
        ])
    }

    private extractUsage(result: any): GeminiUsage {
        try {
            const usageMetadata = result.response.metadata.usage;
            return {
                promptTokens: usageMetadata.promptTokens || 0,
                completionTokens: usageMetadata.completionTokens || 0,
                totalTokens: usageMetadata.totalTokens || 0,
            };
        } catch (error) {
            this.logger.error('Failed to extract token usage from LLM response', error);
        }
        return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }

    private isRateLimitError(error: any): boolean {
        const message = error?.message.toLowerCase() || '';
        const status = error?.status || 0;

        return (
            status === 'RESOURCE_EXHAUSTED' ||
            message.includes('quota') ||
            message.includes('rate limit') ||
            message.includes('429')
        );
    }

    private isServerError(error: any): boolean {
        const status = error.status || error.errorDetails?.[0]?.reason || '';
        
        return (
            status === 'INTERNAL' ||
            status === 'UNAVAILABLE' ||
            status === 'DEADLINE_EXCEEDED' ||
            error.message?.includes('500') ||
            error.message?.includes('503')
        );
    }

    private isCLientError(error: any): boolean {
        const status = error.status || error.errorDetails?.[0]?.reason || '';

        return (
            status === 'INVALID_ARGUMENT' ||
            status === 'NOT_FOUND' ||
            status === 'PERMISSION_DENIED' ||
            error.message?.includes('400') ||
            error.message?.includes('401') ||
            error.message?.includes('403')
        );
    }

    private isSafetyBlockError(error: any): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes('safety') || message.includes('blocked');
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private exponentialBackoff(attempt: number): number {
        return this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
    }

    estimateCost(usage: GeminiUsage): number {
        const inputCostPer1M = 0.075;
        const outputCostPer1M = 0.30;

        const inputCost = (usage.promptTokens / 1_000_000) * inputCostPer1M;
        const outputCost = (usage.completionTokens / 1_000_000) * outputCostPer1M;

        return inputCost + outputCost;
    }
}