
import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import * as fs from "fs/promises"; 
import * as dotenv from 'dotenv';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFParse } from "node_modules/pdf-parse/dist/pdf-parse/esm/PDFParse";

dotenv.config();

const COLLECTION_NAME = 'documents';
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSION = 1536;
const CHUNK_SIZE=500
const CHUNK_OVERLAP=50

const DOCUMENTS = [
    {
        filepath: './documents/job-description.pdf',
        type: "JOB_DESCRIPTION",
        description: 'Backend Engineer Job Description',
    },
    {
        filepath: './documents/case-study-brief.pdf',
        type: "CASE_STUDY",
        description: 'Case Study Requirements and Brief',
    },
    {
        filepath: './documents/cv-rubric.pdf',
        type: "CV_RUBRIC",
        description: 'CV Evaluation Scoring Rubric',
    },
    {
        filepath: './documents/project-rubric.pdf',
        type: "PROJECT_RUBRIC",
        description: 'Project Evaluation Scoring Rubric',
    },
]

console.log(process.env.QDRANT_API_KEY);

class DocumentIngestion {
    private qdrant: QdrantClient;
    private genai: GoogleGenAI;

    constructor() {
        this.qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'https://qdrant.milvus.io', apiKey: process.env.QDRANT_API_KEY });
        this.genai = new GoogleGenAI({});
    }

    async run() {
        console.log('Starting document ingestion...');

        try {
            await this.initializeCollection();

            for (const doc of DOCUMENTS) {
                await this.processDocument(doc.filepath, doc.type, doc.description);
            }

            console.log('Document ingestion completed.');

            await this.showStats();
        } catch (error) {
            console.error('Error during document ingestion:', error);
        }
    }

    async initializeCollection() {
        console.log('Initializing Qdrant collection...');

        try {
                const collections = await this.qdrant.getCollections();

            const exists = collections.collections?.some(c => c.name === COLLECTION_NAME);
            
            if (exists) {
                console.log(`Collection ${COLLECTION_NAME} already exists. Skipping creation.`);
                return 
            }

            await this.qdrant.createCollection(
                COLLECTION_NAME,{
                vectors: {
                    size: EMBEDDING_DIMENSION,
                    distance: 'Cosine',
                },
            });
        } catch (error) {
            console.error('Error initializing Qdrant collection:', error);
        }
    }

    async processDocument(
        filepath: string,
        type: string,
        description: string
    ) {
        console.log(`Processing document: ${filepath}`);

        try {
            const text = await this.extractPDFText(filepath);
            console.log(`Extracted text length: ${text.length} characters`);

            const chunks = this.chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
            console.log(`Chunked into ${chunks.length} pieces.`);

            const embeddings = await this.generateEmbeddings(chunks);
            console.log(`Generated ${embeddings.length} embeddings.`);

            await this.uploadToQdrant(chunks, embeddings, {
                type,
                description,
                filepath,
            });

            console.log(`Uploaded document chunks to Qdrant.`);
        } catch (error) {
            console.error(`Error processing document ${filepath}:`, error);
        }
    }

    async extractPDFText(filepath: string): Promise<string> {
        const buffer = await fs.readFile(filepath);
        const data = await pdfjsLib.getDocument({ data: buffer }).promise;

        let fullText = '';
        for (let i = 1; i <= data.numPages; i++) {
            const page = await data.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText.trim();
    }

    chunkText(text: string, chunkSize: number, chunkOverlap: number): string[] {
        const words = text.split(/\s+/)
        const chunks: string[] = [];

        let i = 0
        while (i < words.length) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
            chunks.push(chunk);
            i += chunkSize - chunkOverlap;
        }

        return chunks.filter(chunk => chunk.length > 50);
    }

    async generateEmbeddings(chunks: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];

        const batchSize = 100

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);

            const response = await this.genai.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: batch,
            })

            embeddings.push(...response.embeddings?.values().next().value || []);
        }

        return embeddings;
    }

    async uploadToQdrant(
        chunks: string[],
        embeddings: number[][],
        doc: { type: string; description: string; filepath: string }
    ) {
        const points = chunks.map((chunk, index) => ({
            id: `${doc.type}-${Date.now()}-${index}`,
            vector: embeddings[index],
            payload: {
                text: chunk,
                document_type: doc.type,
                description: doc.description,
                source_file: doc.filepath,
                chunk_index: index,
                created_at: new Date().toISOString(),
            },
        }));

        const batchSize = 100;
        for (let i = 0; i < points.length; i += batchSize) {
            const batch = points.slice(i, i + batchSize);
            await this.qdrant.upsert(COLLECTION_NAME, {
                points: batch,
            });
        }
    }

    async showStats() {
        const stats = await this.qdrant.getCollection(COLLECTION_NAME);
        console.log('Collection stats:', JSON.stringify(stats, null, 2));
        console.log(`   Total vectors: ${stats.points_count}`);
        console.log(`   Vector dimension: ${stats.config.params.vectors?.size}`);
        console.log(`   Distance metric: ${stats.config.params.vectors?.distance}`);
    }
}

const ingestion = new DocumentIngestion();

ingestion.run();
