import { Injectable, Logger } from "@nestjs/common";
import { QdrantClient } from "@qdrant/js-client-rest";
import { EmbeddingService } from "./embedding.service";

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name);
    private readonly client: QdrantClient;
    private readonly collection_name = 'documents';

    constructor(private embeddingService: EmbeddingService) {
        this.client = new QdrantClient({
            apiKey: process.env.QDRANT_API_KEY || '',
            url: process.env.QDRANT_URL || 'https://qdrant.milvus.io',
        });
    }

    async retrieveContext(
        query: string,
        documentType?: string[],
        topK: number = 5
    ): Promise<string> {
        try {
            this.logger.log(`Retrieving context for query: ${query}`);

            const queryEmbedding = await this.embeddingService.generateEmbedding(query);

            console.log("document type:", documentType);
            const filter = documentType && documentType.length > 0 // Also check if array is not empty
                ? {
                    must: [
                        {
                            key: 'document_type',
                            match: { any: documentType }, // Changed to 'any' for array
                        },
                    ],
                }
                : undefined;

            const searchParams: any = {
                vector: queryEmbedding,
                limit: topK,
                with_payload: true,
            };

            // Only add filter if it exists
            if (filter) {
                searchParams.filter = filter;
            }

            const searchResult = await this.client.search(
                this.collection_name, {
                vector: queryEmbedding,
                limit: topK,
                // filter: filter,
                with_payload: true,
            });

            if (searchResult.length === 0) {
                this.logger.warn('No relevant context found in the vector database.');
                return '';
            }

            this.logger.log(`Found ${searchResult.length} relevant chunks`, {
                topScore: searchResult[0].score,
                avgScore: searchResult.reduce((sum, r) => sum + r.score, 0) / searchResult.length,
            });

            const contexts = searchResult.map((result, index) => {
                const payload = result.payload as any;
                return `Context ${index + 1}, Relevance: ${result.score?.toFixed(4)}\n${payload.text}`;
            });

            return contexts.join('\n---\n\n');
        } catch (error) {
            this.logger.error(`Error retrieving context: ${error}`);
            throw error;
        }
    }

    async retrieveWithRerank(
        query: string,
        documentType?: string[],
        initialK: number = 5,
        finalK: number = 3
    ): Promise<string> {
        try {
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);

            const filter = documentType && documentType.length > 0 ? {
                must: [
                    {
                        key: 'document_type',
                        match: { any: documentType } // Changed from 'value' to 'any'
                    }
                ]
            } : undefined;
            

            const searchResult = await this.client.search(
                this.collection_name, {
                vector: queryEmbedding,
                limit: initialK,
                filter: filter,
                with_payload: true,
            });

            if (searchResult.length === 0) {
                this.logger.warn('No relevant context found in the vector database.');
                return '';
            }

            const reranked = searchResult.map((result) => ({
                text: (result.payload as any).text,
                score: result.score,
                metadata: result.payload,
            })).sort((a, b) => b.score - a.score).slice(0, finalK);

            const contexts = reranked.map((result, index) => {
                return `[Context ${index + 1}]\n${result.text}\n`;
            });

            return contexts.join('\n---\n\n');
        } catch (error) {
            this.logger.error(`Error retrieving context: ${error.message}`);
            throw error;
        }
    }

    async hyBridSearch(
        query: string,
        documentTypes?: string[],
        topK: number = 5
    ): Promise<string> {
        try {
            return this.retrieveContext(query, documentTypes, topK);
        } catch (error) {
            this.logger.error(`Error in hybrid search: ${error.message}`);
            throw error;
        }
    }

}