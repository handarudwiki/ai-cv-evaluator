import { GoogleGenAI} from "@google/genai";

const genai = new GoogleGenAI({
    apiKey: 'AIzaSyCQ0CtHTRHkIPm6-V7pqHnOIAhGo4DRDNo'
})

const response = await genai.models.generateContent({
    config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2500,
        temperature: 0.3,
    },
    model: "gemini-2.5-pro",
    contents: `You are an expert technical recruiter evaluating a candidate's CV against a specific job role.
                Your task is to assess the candidate across these dimensions:
                1. Technical Skills Match (1-5): Alignment with backend, databases, APIs, cloud, AI/LLM requirements
                2. Experience Level (1-5): Years of experience and project complexity
                3. Relevant Achievements (1-5): Impact of past work (scaling, performance, adoption)
                4. Cultural/Collaboration Fit (1-5): Communication, learning mindset, teamwork

                SCORING GUIDE:
                - 1 = Not demonstrated or irrelevant
                - 2 = Minimal/basic level
                - 3 = Adequate/average
                - 4 = Strong/good
                - 5 = Excellent/exceptional

                You must respond with a valid JSON object in this exact format:
                {
                "technical_skills": <number 1-5>,
                "experience_level": <number 1-5>,
                "relevant_achievements": <number 1-5>,
                "cultural_fit": <number 1-5>,
                "feedback": "<string: 3-5 sentences explaining the overall CV assessment>"
                }

                Be objective, fair, and specific in your evaluation. Base scores on evidence from the CV.
---
JOB ROLE: Backend Engineer

            RELEVANT JOB REQUIREMENTS AND EVALUATION CRITERIA:
            Context 1, Relevance: 0.6883
JOB DESCRIPTION Rakamin is hiring a Product Engineer (Backend) to work on Rakamin. We're looking for dedicated engineers who write code they’re proud of and who are eager to keep scaling and improving complex systems, including those powered by AI. About the Job You'll be building new product features alongside a frontend engineer and product manager using our Agile methodology, as well as addressing issues to ensure our apps are robust and our codebase is clean. As a Product Engineer, you'll write clean, efficient code to enhance our product's codebase in meaningful ways. In addition to classic backend work, this role also touches on building AI-powered systems, where you’ll design and orchestrate how large language models (LLMs) integrate into Rakamin’s product ecosystem. Here are some real examples of the work in our team: ● Collaborating with frontend engineers and 3rd parties to build robust backend solutions that support highly configurable platforms and cross-platform integration. ● Developing and maintaining server-side logic for central database, ensuring high performance throughput and response time. ● Designing and fine-tuning AI prompts that align with product requirements and user contexts. ● Building LLM chaining flows, where the output from one model is reliably passed to and enriched by another. ● Implementing Retrieval-Augmented Generation (RAG) by embedding and retrieving context from vector databases, then injecting it into AI prompts to improve accuracy and relevance. ● Handling long-running AI processes gracefully — including job orchestration, async background workers, and retry mechanisms. ● Designing safeguards for uncontrolled scenarios: managing failure cases from 3rd party APIs and mitigating the randomness/nondeterminism of LLM outputs. ● Leveraging AI tools and workflows to increase team productivity (e.g., AI-assisted code generation, automated QA, internal bots). ● Writing reusable, testable, and efficient code to improve the functionality of our existing systems. ● Strengthening our test coverage with RSpec to build robust and reliable web apps. ● Conducting full product lifecycles, from idea generation to design, implementation, testing, deployment, and maintenance. ● Providing input on technical feasibility, timelines, and potential product trade-offs, working with business divisions. -- 1 of 2 -- ● Actively engaging with users and stakeholders to understand their needs and translate them into backend and AI-driven improvements. -- 2 of 2 -- 
---

Context 2, Relevance: 0.6883
JOB DESCRIPTION Rakamin is hiring a Product Engineer (Backend) to work on Rakamin. We're looking for dedicated engineers who write code they’re proud of and who are eager to keep scaling and improving complex systems, including those powered by AI. About the Job You'll be building new product features alongside a frontend engineer and product manager using our Agile methodology, as well as addressing issues to ensure our apps are robust and our codebase is clean. As a Product Engineer, you'll write clean, efficient code to enhance our product's codebase in meaningful ways. In addition to classic backend work, this role also touches on building AI-powered systems, where you’ll design and orchestrate how large language models (LLMs) integrate into Rakamin’s product ecosystem. Here are some real examples of the work in our team: ● Collaborating with frontend engineers and 3rd parties to build robust backend solutions that support highly configurable platforms and cross-platform integration. ● Developing and maintaining server-side logic for central database, ensuring high performance throughput and response time. ● Designing and fine-tuning AI prompts that align with product requirements and user contexts. ● Building LLM chaining flows, where the output from one model is reliably passed to and enriched by another. ● Implementing Retrieval-Augmented Generation (RAG) by embedding and retrieving context from vector databases, then injecting it into AI prompts to improve accuracy and relevance. ● Handling long-running AI processes gracefully — including job orchestration, async background workers, and retry mechanisms. ● Designing safeguards for uncontrolled scenarios: managing failure cases from 3rd party APIs and mitigating the randomness/nondeterminism of LLM outputs. ● Leveraging AI tools and workflows to increase team productivity (e.g., AI-assisted code generation, automated QA, internal bots). ● Writing reusable, testable, and efficient code to improve the functionality of our existing systems. ● Strengthening our test coverage with RSpec to build robust and reliable web apps. ● Conducting full product lifecycles, from idea generation to design, implementation, testing, deployment, and maintenance. ● Providing input on technical feasibility, timelines, and potential product trade-offs, working with business divisions. -- 1 of 2 -- ● Actively engaging with users and stakeholders to understand their needs and translate them into backend and AI-driven improvements. -- 2 of 2 -- 
---

Context 3, Relevance: 0.6883
JOB DESCRIPTION Rakamin is hiring a Product Engineer (Backend) to work on Rakamin. We're looking for dedicated engineers who write code they’re proud of and who are eager to keep scaling and improving complex systems, including those powered by AI. About the Job You'll be building new product features alongside a frontend engineer and product manager using our Agile methodology, as well as addressing issues to ensure our apps are robust and our codebase is clean. As a Product Engineer, you'll write clean, efficient code to enhance our product's codebase in meaningful ways. In addition to classic backend work, this role also touches on building AI-powered systems, where you’ll design and orchestrate how large language models (LLMs) integrate into Rakamin’s product ecosystem. Here are some real examples of the work in our team: ● Collaborating with frontend engineers and 3rd parties to build robust backend solutions that support highly configurable platforms and cross-platform integration. ● Developing and maintaining server-side logic for central database, ensuring high performance throughput and response time. ● Designing and fine-tuning AI prompts that align with product requirements and user contexts. ● Building LLM chaining flows, where the output from one model is reliably passed to and enriched by another. ● Implementing Retrieval-Augmented Generation (RAG) by embedding and retrieving context from vector databases, then injecting it into AI prompts to improve accuracy and relevance. ● Handling long-running AI processes gracefully — including job orchestration, async background workers, and retry mechanisms. ● Designing safeguards for uncontrolled scenarios: managing failure cases from 3rd party APIs and mitigating the randomness/nondeterminism of LLM outputs. ● Leveraging AI tools and workflows to increase team productivity (e.g., AI-assisted code generation, automated QA, internal bots). ● Writing reusable, testable, and efficient code to improve the functionality of our existing systems. ● Strengthening our test coverage with RSpec to build robust and reliable web apps. ● Conducting full product lifecycles, from idea generation to design, implementation, testing, deployment, and maintenance. ● Providing input on technical feasibility, timelines, and potential product trade-offs, working with business divisions. -- 1 of 2 -- ● Actively engaging with users and stakeholders to understand their needs and translate them into backend and AI-driven improvements. -- 2 of 2 -- 
---

Context 4, Relevance: 0.6275
Case Study Brief Hello! Thank you for applying with us as a backend developer. This mini project should be completed within 5 days after you have received this document. Please spare your time to complete this project with the best results. We are really pleased to answer your questions if there are unclear things. Objective Your mission is to build a backend service that automates the initial screening of a job application. The service will receive a candidate's CV and a project report, evaluate them against a specific job description and a case study brief, and produce a structured, AI-generated evaluation report. Core Logic & Data Flow The system operates with a clear separation of inputs and reference documents: Candidate-Provided Inputs (The Data to be Evaluated): 1. Candidate CV: The candidate's resume (PDF). 2. Project Report: The candidate's project report to our take-home case study (PDF) System-Internal Documents (The "Ground Truth" for Comparison): 1. Job Description: A document detailing the requirements and responsibilities for the role — You can use the job description you’re currently applying. This document will be used as ground truth for Candidate CV. ◦ To make sure the vector retrieval is accurate enough, you might need to ingest a few job description documents as well. 2. Case Study Brief: This document. Used as ground truth for Project Report. (PDF) 3. Scoring Rubric: A predefined set of parameters for evaluating CV and Report, each has it’s own documents. (PDF) We want to see your ability to combine backend engineering with AI workflows (prompt design, LLM chaining, retrieval, resilience). Deliverables 1. Backend Service (API endpoints) Implement a backend service with at least the following RESTful API endpoints: • ◦ ◦ • ◦ ◦ Accepts multipart/form-data containing the Candidate CV and Project Report (PDF). Stores these files, return each with it’s own ID for later processing. Triggers the asynchronous AI evaluation pipeline. Receives input job title (string), and both document ID. Immediately returns a job ID to track the evaluation process. • ◦ Retrieves the status and result of an evaluation job. This endpoint should reflect the asynchronous, multi-stage nature of the process. ◦ Possible responses: ▪ While queued or processing ▪ Once completed -- 1 of 4 -- 2. Evaluation Pipeline Design and implement an AI-driven pipeline which will be triggered by [POST] Components: endpoint. Should consist these key • RAG (Context Retrieval) ◦ Ingest all System-Internal Documents (Job Description, Case Study Brief, Both Scoring Rubrics) into a vector database. ◦ Retrieve relevant sections and inject into prompts (e.g., “for CV scoring” vs “for project scoring”). • Prompt Design & LLM Chaining The pipeline should consists of ◦ CV Evaluation ▪ Parse the candidate’s CV into structured data. ▪ Retrieve relevant information from both Job Description and CV Scoring Rubrics. ▪ Use an LLM to get these result: & ◦ Project Report Evaluation ▪ Parse the candidate's Project Report into structured data. ▪ Retrieve relevant information from both Case Study Brief and CV Scoring Rubrics. ▪ Use an
---

Context 5, Relevance: 0.6275
Case Study Brief Hello! Thank you for applying with us as a backend developer. This mini project should be completed within 5 days after you have received this document. Please spare your time to complete this project with the best results. We are really pleased to answer your questions if there are unclear things. Objective Your mission is to build a backend service that automates the initial screening of a job application. The service will receive a candidate's CV and a project report, evaluate them against a specific job description and a case study brief, and produce a structured, AI-generated evaluation report. Core Logic & Data Flow The system operates with a clear separation of inputs and reference documents: Candidate-Provided Inputs (The Data to be Evaluated): 1. Candidate CV: The candidate's resume (PDF). 2. Project Report: The candidate's project report to our take-home case study (PDF) System-Internal Documents (The "Ground Truth" for Comparison): 1. Job Description: A document detailing the requirements and responsibilities for the role — You can use the job description you’re currently applying. This document will be used as ground truth for Candidate CV. ◦ To make sure the vector retrieval is accurate enough, you might need to ingest a few job description documents as well. 2. Case Study Brief: This document. Used as ground truth for Project Report. (PDF) 3. Scoring Rubric: A predefined set of parameters for evaluating CV and Report, each has it’s own documents. (PDF) We want to see your ability to combine backend engineering with AI workflows (prompt design, LLM chaining, retrieval, resilience). Deliverables 1. Backend Service (API endpoints) Implement a backend service with at least the following RESTful API endpoints: • ◦ ◦ • ◦ ◦ Accepts multipart/form-data containing the Candidate CV and Project Report (PDF). Stores these files, return each with it’s own ID for later processing. Triggers the asynchronous AI evaluation pipeline. Receives input job title (string), and both document ID. Immediately returns a job ID to track the evaluation process. • ◦ Retrieves the status and result of an evaluation job. This endpoint should reflect the asynchronous, multi-stage nature of the process. ◦ Possible responses: ▪ While queued or processing ▪ Once completed -- 1 of 4 -- 2. Evaluation Pipeline Design and implement an AI-driven pipeline which will be triggered by [POST] Components: endpoint. Should consist these key • RAG (Context Retrieval) ◦ Ingest all System-Internal Documents (Job Description, Case Study Brief, Both Scoring Rubrics) into a vector database. ◦ Retrieve relevant sections and inject into prompts (e.g., “for CV scoring” vs “for project scoring”). • Prompt Design & LLM Chaining The pipeline should consists of ◦ CV Evaluation ▪ Parse the candidate’s CV into structured data. ▪ Retrieve relevant information from both Job Description and CV Scoring Rubrics. ▪ Use an LLM to get these result: & ◦ Project Report Evaluation ▪ Parse the candidate's Project Report into structured data. ▪ Retrieve relevant information from both Case Study Brief and CV Scoring Rubrics. ▪ Use an

            CANDIDATE'S CV:
            HANDARU DWIKI YUNTARA
+62 838 9616 8416 | Trenggalek |handarudwiki04@gmail.com | LinkedIn | Github
Aspiring Backend Developer with a strong foundation in building scalable web applications and APIs.
Experienced in delivering real-world software projects, participating in national-level tech competitions, and
actively contributing to developer communities through technical talks and workshops. Proficient in backend
technologies such as Go, Gin, Gorm , Node.js, Express, PostgreSQL, and RESTful API design. Eager to join a
forward-thinking team to design robust backend systems and solve real-world problems through clean, efficient code
EXPERIENCE
1. Internship at Adma Digital Solusi
Backend Developer Intern | [September 2024] – [December 2024]
● Architected and developed a robust backend for a Content Management System (CMS), empowering a
government agency client to manage web content efficiently and independently.
● Engineered core features for a financial management system, including user authentication and
transaction logging modules, to automate key client business processes.
● Collaborated closely with the front-end team to ensure seamless API integration and align application
functionality with user requirements in an Agile environment.
● Technologies: [Typescript, Node.js, Express.js, PostgreSQL, JWT, Git]
2. Internship at Adamlabs
Backend Developer Intern | Adamlabs | [January 2025] – [Appril 2025]
● Developed key backend modules for a digital laboratory service within a microservices-based
hospital management system, focusing on sample data management and appointment scheduling.
● Built and documented RESTful API endpoints to facilitate reliable and efficient data exchange between
the server and client-side applications.
● Implemented comprehensive unit tests to ensure code stability and reliability, significantly reducing
potential bugs before deployment to production.
● Technologies: [Node.js, Express.js, PostgreSQL, JWT, Git]
3. Freelance Work for Duitaja
Freelance Backend Developer | Duitaja Project | [September 2024] – [Now]
● Architected a scalable backend system from the ground up for a Point-of-Sale (POS) and accounting
application tailored for Small and Medium-sized Enterprises (SMEs).
● Delivered critical features including real-time inventory management, secure transaction processing, and
automated monthly financial reporting.
● Secured sensitive client data by implementing industry-standard encryption and hashing protocols within
the database management system.
● Impact: Enabled the client to digitize their operations, leading to enhanced data accuracy and a significant
reduction in time spent on sales reconciliation.
● Technologies: [Go Redis, FCM, RabbiqMQ, Git, PostgreSQL]
4. Fulltime Work at STAMPS
Software Engineer | STAMPS | [Agustus 2025] - [Now]
● Contributed to a large-scale product by refactoring legacy code, fixing bugs, and resolving production errors
reported through Sentry.
● Developed and maintained UI components and page layouts for new product features, ensuring consistency
and usability.
● Implemented several API endpoints and key backend functionalities, including authentication and account
management for a client’s custom application.
● Wrote and maintained unit and integration tests to enhance code reliability and system stability.
● Technologies: [Django, Redis, PubSub, Git, PostgreSQL, Javascript]
5. Head of Social and Community
Department [ UKKI ] September 2024 – April 2025
● Leading a team of 5 members to plan and execute community service programs
● Initiated and organized 4 social projects
● Collaborating with external partners and campus stakeholders to support social initiatives-- 1 of 2 --EDUCATION
Politeknik Elektronika Negeri Surabaya | Computer Science | 2022 – 2025
GPA = 3.69
COURSE & CERTIFICATIONS
Vocational School Graduate Academy — Junior Web Developer
Organized by the Ministry of Communication and Information Technology (Kominfo)
● Developed a dynamic website using PHP, HTML, CSS, and JavaScript to showcase the Ministry’s
activities
● Implemented key features including landing page, user authentication (login), and full CRUD (create, read,
update, delete) functionality for managing activity data
● Designed the landing page to display a list of Kominfo’s programs and initiatives, ensuring a user-friendly
interface
Basic Backend Development - Dicoding
Completed training on backend fundamentals, including:
● AWS Cloud Practitioner Essentials — learned core cloud concepts and AWS services.
● JavaScript Fundamentals — covered modern JavaScript (ES6+), asynchronous programming, and OOP.
● Backend Development — built RESTful APIs with Node.js and Express, connected to databases,
and implemented routing and middleware.
COMPETITION
1st Place – Carnival Technology, Jember University
Web App Developer
Built a crowdfunding platform (3funding) to help students fund their innovative ideas.
● Developed RESTful APIs (Laravel) for authentication, proposal management, and donation features
(integrated with Midtrans).
● Collaborated in a team of 3; frontend built with Vue.js, backend with Laravel, MySQL database.
Finalist – KMIPN VI (Politeknik Negeri Jakarta), E-Government
Backend Developer
Developed backend for a mobile app to address illegal parking issues.
● Implemented APIs (Laravel) for reporting, supporting, and tracking parking violations.
● Built real-time dashboard for transportation authorities and exportable reports (Excel).
● Features included location-based reporting, case updates, and public transparency.
COMMUNITY INVOLMENT & PUBLIC SPEAKING
● Speaker, "Introduction to SQL" Webinar (200+ registrants, 100+ attendees)
Taught SQL basics and best practices in an online webinar.
● Occasional speaker at Web Developer Community
Shared insights on web development topics with fellow developers
SKILL
● Technical: JavaScript (ES6+), Go , SQL, NOSQL, Kafka & RabbitMQ, Docker, Nodejs, Typescript, React,
Nextjs, Git, CI/CD ,LLM/AI (prompt engineering, API integration)
● Non-Technical: Design Thinking, User Research, Project Management, Team Collaboration
● Languages: Indonesian (Native), English-- 2 of 2 --`
});

console.log("++++++++++ ", response.text)
console.log("Evaluation Response:", response.text);
console.log("response ", response)