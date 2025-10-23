AI-Powered CV Evaluator
An automated backend service for screening job applications using AI/LLM technology, RAG (Retrieval-Augmented Generation), and async job processing.
🚀 Quick Start
Prerequisites

Node.js 18+ & npm
Gemini API key

1. Clone & Install
bash# Clone repository
git clone <your-repo-url>
cd ai-cv-evaluator

## Install dependencies
npm install

## Copy environment file
cp .env.example .env

## Edit .env and add your Gemini API key
nano .env
2. Start Infrastructure
bash# Start PostgreSQL, Redis, and Qdrant

## Wait for services to be healthy
3. Setup Database
bash# Generate Prisma client
npm run prisma:generate

## Run migrations
npm run prisma:migrate

## (Optional) Open Prisma Studio
npm run prisma:studio
4. Ingest System Documents
bash# Place your documents in ./documents/ folder:
 - job-description.pdf
 - case-study-brief.pdf
 - cv-rubric.pdf
 - project-rubric.pdf

## Run ingestion script
npm run ingest-documents

## Expected output:
### 🚀 Starting document ingestion...
### 📦 Initializing Qdrant collection...
### ✓ Collection created
### 📄 Processing: Backend Engineer Job Description
### ...
### ✅ Ingestion completed successfully!
5. Start Application
bash# Development mode (with hot reload)
npm run start:dev

## Production mode
npm run build
npm run start:prod
The API will be available at http://localhost:3000

🔧 Configuration
Environment Variables
bash# Application
REDIS_HOST=
REDIS_PORT          
APP_URL=
DATABSE_URL=
QDRANT_API_KEY=
QDRANT_URL=
GEMINI_API_KEY=                

## Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

## Redis
REDIS_HOST=localhost
REDIS_PORT=6379

## Qdrant Vector Database
QDRANT_URL=http://localhost:6333

## Gemini API
GEMINI_API_KEY=sk-...        # Your Gemini API key
Adjusting LLM Parameters
Edit src/modules/llm/llm.service.ts:
typescript// Timeout per LLM call
private readonly TIMEOUT_MS = 45000; // 45 seconds

// Max retries on failure
private readonly MAX_RETRIES = 3;

// Model selection
model: 'gpt-4-turbo-preview',  // or 'gpt-3.5-turbo' for cost savings

// Temperature (consistency vs creativity)
temperature: 0.3,  // Lower = more consistent, Higher = more creative
Adjusting RAG Parameters
Edit scripts/ingest-documents.ts:
typescriptconst CHUNK_SIZE = 500;      // Tokens per chunk
const CHUNK_OVERLAP = 50;    // Overlap between chunks
const EMBEDDING_MODEL = 'text-embedding-3-small';


## Poll for results
watch curl http://localhost:3000/result/<job-id>
Unit Tests
bashnpm run test
npm run test:watch
npm run test:cov


🎯 Design Decisions
1. Why NestJS?

Built-in dependency injection
Excellent TypeScript support
Module-based architecture
Easy integration with BullMQ, Prisma

2. Why BullMQ over other queues?

Native TypeScript support
Robust retry mechanism with exponential backoff
Built-in observability (progress, metrics)
Redis-backed (fast, reliable)

3. Why Qdrant over Pinecone/Weaviate?

Self-hosted (no vendor lock-in)
Excellent performance
Simple REST API
TypeScript SDK available
Free for development

4. RAG Strategy

Chunking: 500 tokens with 50-token overlap

Balances context completeness vs relevance


Embedding Model: text-embedding-3-small

Cost-effective, fast, sufficient quality


Retrieval: Top-5 chunks per query

Enough context without overwhelming prompt


Metadata Filtering: By document type

Ensures relevant documents (CV rubric for CV eval, etc.)



6. Error Handling Strategy

Validation errors (4xx): Fail fast, don't retry
Rate limits (429): Exponential backoff with max 3 retries
Timeouts: 45s per LLM call, retry on timeout
Server errors (5xx): Retry with backoff
Parsing errors: Don't retry, log and throw
Missing RAG context: Proceed with warning (degraded quality)

7. Temperature Settings

CV Evaluation: 0.3 (need consistency in scoring)
Project Evaluation: 0.3 (need consistency in scoring)
Final Summary: 0.4 (slightly higher for natural language)

8. Cost Optimization

Use gpt-4-turbo-preview for quality (can switch to gpt-3.5-turbo for cost)
Batch embedding generation where possible
Cache embeddings for system documents (one-time ingestion)
Token counting to track costs


📊 Evaluation Pipeline Flow
mermaidgraph TD
    A[POST /evaluate] --> B[Create Job Record]
    B --> C[Add to BullMQ Queue]
    C --> D[Return job_id immediately]
    
    E[Worker Picks Up Job] --> F[Parse CV PDF]
    E --> G[Parse Report PDF]
    
    F --> H[RAG: Retrieve Job Requirements]
    H --> I[LLM Call 1: CV Evaluation]
    I --> J{Valid JSON?}
    J -->|Yes| K[Store CV Scores]
    J -->|No| L[Retry up to 3x]
    L --> I
    
    G --> M[RAG: Retrieve Case Study Requirements]
    M --> N[LLM Call 2: Project Evaluation]
    N --> O{Valid JSON?}
    O -->|Yes| P[Store Project Scores]
    O -->|No| Q[Retry up to 3x]
    Q --> N
    
    K --> R[LLM Call 3: Final Summary]
    P --> R
    R --> S[Calculate Final Scores]
    S --> T[Save to Database]
    T --> U[Job Status: COMPLETED]
    
    L -->|Max retries| V[Job Status: FAILED]
    Q -->|Max retries| V

🔍 Monitoring & Debugging
View Logs
bash# Application logs
npm run start:dev  # Logs appear in console


## Access dashboard at http://localhost:3000/admin/queues
Database Inspection
bash# Open Prisma Studio
npm run prisma:studio

## Or use psql
docker exec -it cv-evaluator-db psql -U postgres -d cv_evaluator

## Check job statuses
SELECT id, status, created_at FROM "EvaluationJob" ORDER BY created_at DESC LIMIT 10;
Qdrant Inspection
bash# Check collection info
curl http://localhost:6333/collections/evaluation_documents

## Count points
curl http://localhost:6333/collections/evaluation_documents/points/count

## Search test
curl -X POST http://localhost:6333/collections/evaluation_documents/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "limit": 5
  }'

🐛 Troubleshooting
Issue: "Gemini API key not found"
Solution:
bash# Check .env file
cat .env | grep GEMINI_API_KEY

# Ensure it's exported
export GEMINI_API_KEY=sk-...

## Restart application
npm run start:dev
Issue: "Cannot connect to Redis"
Solution:
bash# Check Redis is running
docker-compose ps

## Check Qdrant is accessible
curl http://localhost:6333/health
Issue: "Job stuck in PROCESSING status"
Solution:
bash# Check worker logs for errors
## Jobs timeout after 5 minutes automatically

## Manually update job status in database
npm run prisma:studio
## Find job and update status to FAILED
Issue: "PDF parsing failed"
Solution:
bash# Ensure PDF is valid
file your-document.pdf

## Try opening in PDF reader
## If corrupted, re-export/save as new PDF

## Check file size (very large PDFs may timeout)
ls -lh your-document.pdf
Issue: "Rate limit exceeded"
Solution:
bash# Check Gemini usage dashboard
## The system will automatically retry with backoff

If persistent, consider:
 1. Reduce concurrent workers
 2. Add longer delays between retries
 3. Upgrade Gemini plan

📈 Performance Optimization
1. Increase Worker Concurrency
typescript// In evaluation.processor.ts
const worker = new Worker('evaluation', processor, {
  concurrency: 5, // Process 5 jobs simultaneously
});
2. Optimize Chunking
typescript// Larger chunks = fewer embeddings = lower cost
const CHUNK_SIZE = 800;  // Increase from 500

// But: May reduce retrieval precision
3. Cache RAG Results
typescript// Add Redis caching for frequent queries
const cacheKey = `rag:${query}:${documentTypes.join(',')}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const result = await this.ragService.retrieveContext(...);
await redis.setex(cacheKey, 3600, result); // Cache 1 hour
4. Use Cheaper LLM for Simple Tasks
typescript// Use GPT-3.5-turbo for initial parsing
// Use GPT-4 only for final scoring
model: process.env.LLM_MODEL || 'gpt-4-turbo-preview',

🔐 Security Considerations
API Authentication (Bonus)
typescript// Add JWT authentication
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('evaluate')
@UseGuards(JwtAuthGuard)
export class EvaluationController {
  // ...
}
Rate Limiting (Bonus)
typescript// Install throttler
npm install @nestjs/throttler

// Add to app.module.ts
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10, // 10 requests per minute
}),
File Upload Validation
typescript// In documents.controller.ts
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Post('upload')
@UseInterceptors(
  FileInterceptor('file', {
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Only PDF files allowed'), false);
      }
      cb(null, true);
    },
  }),
)

📝 Testing with Real Data
Test Scenario 1: Strong Candidate
bash# Upload a CV with:
 - 5+ years backend experience
 - Python/Node.js skills
 - Cloud experience (AWS/GCP)
 - AI/LLM projects mentioned

 Upload a project report with:
 - Complete implementation
 - Clean code structure
 - Good documentation
 - Error handling

 Expected Result:
 - CV match rate: 0.80-0.95
 - Project score: 4.0-5.0
 - Overall: "Strong Hire" or "Hire"
Test Scenario 2: Junior Candidate
bash# Upload a CV with:
- 1-2 years experience
- Basic backend skills
- No AI/LLM experience

Upload a project report with:
- Basic implementation
- Some structure issues
- Minimal documentation

Expected Result:
- CV match rate: 0.40-0.60
- Project score: 2.5-3.5
- Overall: "Consider" or "Maybe"
Test Scenario 3: Edge Cases
bash# Test with:
- Very short CV (1 page)
- Very long CV (10+ pages)
- Non-English CV
- Scanned PDF (image-based)
- Corrupted PDF

Verify error handling and logging

🎓 Learning Resources
Understanding RAG

Pinecone RAG Guide
LangChain RAG Docs

LLM Prompting

Gemini Prompt Engineering
Anthropic Prompt Library

Vector Databases

Qdrant Documentation
Understanding Embeddings


🤝 Contributing
Code Style

Use Prettier for formatting: npm run format
Use ESLint for linting: npm run lint
Follow NestJS best practices

Commit Convention
feat: Add new feature
fix: Bug fix
docs: Documentation update
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks

📄 License
MIT License - feel free to use for your projects!

🙋 Support
If you encounter issues:

Check troubleshooting section above
Review logs: docker-compose logs -f
Check GitHub Issues
Contact: your-email@example.com


🎯 Future Improvements
Phase 2 (If more time available)

 Add authentication (JWT)
 Add rate limiting per user
 Implement webhook notifications
 Add cost tracking dashboard
 Support multiple LLM providers (fallback)
 Add test coverage (unit + integration)
 Implement hybrid search (semantic + keyword)
 Add evaluation history comparison
 Export results to PDF report
 Add health check endpoints

Phase 3 (Production Ready)

 Implement proper logging (Winston + CloudWatch)
 Add metrics (Prometheus + Grafana)
 Implement circuit breakers
 Add request tracing (OpenTelemetry)
 Set up CI/CD pipeline
 Add load testing
 Implement data retention policies
 Add GDPR compliance features
 Set up disaster recovery
 Performance benchmarking


📞 Contact
Developer: Handaru Dwiki Yuntara
Email: handarudwiki04@gmail.com
GitHub: github.com/handaru-dwiki

Built with ❤️ using TypeScript, NestJS, Gemini, and Qdrant