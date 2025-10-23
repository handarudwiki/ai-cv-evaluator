import { GoogleGenAI } from "@google/genai";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name);
    private readonly genai: GoogleGenAI;
    private readonly EMBEDDING_MODEL = 'gemini-embedding-001';
    private readonly EMBEDDING_DIMENSION = 1536;

    constructor() {
        this.genai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.genai.models.embedContent({
                model: this.EMBEDDING_MODEL,
                contents: text,
                config:{
                    outputDimensionality: this.EMBEDDING_DIMENSION,
                }
            });

            return Array.from(response.embeddings?.values() || []).map(item => item.values || [])[0] || [];
        } catch (error) {
            this.logger.error('Error generating embedding', error);
            throw error;
        }
    }

    async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
        try {
            const response = await this.genai.models.embedContent({
                model: this.EMBEDDING_MODEL,
                contents: texts,
                config:{
                    outputDimensionality: this.EMBEDDING_DIMENSION,
                }
            });

            return [...response.embeddings?.values() || []].map(item => item.values || []) || [];
        } catch (error) {
            this.logger.error('Error generating batch embeddings', error);
            throw error;
        }
    }

    cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must be of the same length for cosine similarity calculation.');
        }

        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magnitudeA += vecA[i] * vecA[i];
            magnitudeB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    }

    getDimension(): number {
        return this.EMBEDDING_DIMENSION;
    }
}