// src/modules/llm/llm.service.ts (Gemini Implementation)
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export interface LLMCallOptions {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
}

interface GeminiUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

@Injectable()
export class LLMService {
    private readonly logger = new Logger(LLMService.name);
    private readonly genAI: GoogleGenerativeAI;
    private readonly MAX_RETRIES = 3;
    private readonly TIMEOUT_MS = 45000; // 45 seconds
    private readonly BASE_DELAY_MS = 2000; // 2 seconds

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }

    /**
     * Call Gemini API with automatic retry logic
     * Handles: rate limits, timeouts, transient errors
     */
    async callWithRetry<T>(
        options: LLMCallOptions,
        parseResponse: (text: string) => T,
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                this.logger.log(`LLM call attempt ${attempt}/${this.MAX_RETRIES}`);

                const startTime = Date.now();

                // Get the generative model
                const model = this.genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash', // or 'gemini-1.5-pro' for better quality
                    generationConfig: {
                        temperature: options.temperature ?? 0.3,
                        maxOutputTokens: options.maxTokens ?? 2500,
                        // For JSON output, guide the model in the prompt
                        ...(options.responseFormat === 'json' && {
                            responseMimeType: 'application/json',
                        }),
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
                    ],
                });

                // Combine system and user prompts
                // Gemini doesn't have separate system messages, so combine them
                const fullPrompt = this.buildFullPrompt(options.systemPrompt, options.userPrompt);

                // Call with timeout
                const resultPromise = model.generateContent(fullPrompt);
                const result = await this.withTimeout(resultPromise, this.TIMEOUT_MS);

                const duration = Date.now() - startTime;

                // Extract response text
                const response = result.response;
                const content = response.text();

                if (!content) {
                    throw new Error('Empty response from LLM');
                }

                // Parse and validate response
                const parsed = parseResponse(content);

                // Extract token usage
                const usage = this.extractUsage(result);

                // Log success metrics
                this.logger.log('LLM call successful', {
                    attempt,
                    duration: `${duration}ms`,
                    tokens: usage.totalTokens,
                    promptTokens: usage.promptTokens,
                    completionTokens: usage.completionTokens,
                });

                return parsed;

            } catch (error) {
                lastError = error;

                this.logger.warn(`LLM call failed on attempt ${attempt}`, {
                    error: error.message,
                    type: error.constructor.name,
                    errorInfo: error.errorDetails || error.status,
                });

                // Handle rate limits (429 or RESOURCE_EXHAUSTED)
                if (this.isRateLimitError(error)) {
                    const waitTime = this.exponentialBackoff(attempt);
                    this.logger.warn(`Rate limited. Waiting ${waitTime}ms before retry`);

                    if (attempt < this.MAX_RETRIES) {
                        await this.sleep(waitTime);
                        continue;
                    }
                }

                // Handle timeouts
                if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
                    this.logger.warn(`Timeout occurred. Retrying...`);

                    if (attempt < this.MAX_RETRIES) {
                        await this.sleep(this.exponentialBackoff(attempt));
                        continue;
                    }
                }

                // Handle server errors (INTERNAL, UNAVAILABLE)
                if (this.isServerError(error)) {
                    this.logger.warn(`Server error. Retrying...`);

                    if (attempt < this.MAX_RETRIES) {
                        await this.sleep(this.exponentialBackoff(attempt));
                        continue;
                    }
                }

                // Handle parsing errors - don't retry
                if (error.message.includes('Invalid') || error.message.includes('parse')) {
                    this.logger.error('Response parsing failed', { error: error.message });
                    throw error; // Don't retry on validation errors
                }

                // Handle safety blocks
                if (this.isSafetyBlockError(error)) {
                    this.logger.error('Content blocked by safety filters', {
                        error: error.message,
                    });
                    throw new Error('Content blocked by safety filters. Please modify the input.');
                }

                // Handle client errors (INVALID_ARGUMENT) - don't retry
                if (this.isClientError(error)) {
                    this.logger.error('Client error, not retrying', { error: error.message });
                    throw error;
                }

                // Unknown error - retry
                if (attempt < this.MAX_RETRIES) {
                    await this.sleep(this.exponentialBackoff(attempt));
                    continue;
                }
            }
        }

        // All retries exhausted
        this.logger.error(`LLM call failed after ${this.MAX_RETRIES} attempts`);
        throw new Error(
            `LLM call failed after ${this.MAX_RETRIES} attempts. Last error: ${lastError.message}`,
        );
    }

    /**
     * Build full prompt combining system and user prompts
     * Gemini doesn't have separate system messages
     */
    private buildFullPrompt(systemPrompt: string, userPrompt: string): string {
        return `${systemPrompt}\n\n---\n\n${userPrompt}`;
    }

    /**
     * Wrap promise with timeout
     */
    private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeoutMs),
            ),
        ]);
    }

    /**
     * Extract token usage from response
     */
    private extractUsage(result: any): GeminiUsage {
        try {
            const usageMetadata = result.response?.usageMetadata;
            if (usageMetadata) {
                return {
                    promptTokens: usageMetadata.promptTokenCount || 0,
                    completionTokens: usageMetadata.candidatesTokenCount || 0,
                    totalTokens: usageMetadata.totalTokenCount || 0,
                };
            }
        } catch {
            // Fallback if usage metadata not available
        }

        return {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
        };
    }

    /**
     * Check if error is a rate limit error
     */
    private isRateLimitError(error: any): boolean {
        const message = error.message?.toLowerCase() || '';
        const status = error.status || error.errorDetails?.[0]?.reason || '';

        return (
            status === 'RESOURCE_EXHAUSTED' ||
            message.includes('quota') ||
            message.includes('rate limit') ||
            message.includes('429')
        );
    }

    /**
     * Check if error is a server error (should retry)
     */
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

    /**
     * Check if error is a client error (don't retry)
     */
    private isClientError(error: any): boolean {
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

    /**
     * Check if content was blocked by safety filters
     */
    private isSafetyBlockError(error: any): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes('safety') || message.includes('blocked');
    }

    /**
     * Exponential backoff: 2s, 4s, 8s
     */
    private exponentialBackoff(attempt: number): number {
        return this.BASE_DELAY_MS * Math.pow(2, attempt - 1);
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Estimate cost of a completion
     * Gemini 1.5 Flash pricing (as of 2024)
     */
    estimateCost(usage: GeminiUsage): number {
        // Gemini 1.5 Flash pricing
        // Free tier: First 15 requests per minute, 1 million tokens per day
        // Paid tier (after free limits):
        const inputCostPer1M = 0.075; // $0.075 per 1M tokens
        const outputCostPer1M = 0.30; // $0.30 per 1M tokens

        const inputCost = (usage.promptTokens / 1_000_000) * inputCostPer1M;
        const outputCost = (usage.completionTokens / 1_000_000) * outputCostPer1M;

        return inputCost + outputCost;
    }
}