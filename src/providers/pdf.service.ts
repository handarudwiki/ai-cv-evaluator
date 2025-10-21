import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist';

@Injectable()
export class PdfService implements OnModuleInit{

    async onModuleInit() {}

    private readonly logger = new Logger(PdfService.name);

    async extractText(filepath: string): Promise<string> {
        try {
            this.logger.log(`Reading PDF file from path: ${filepath}`);

            const dataBuffer = await fs.readFile(filepath);

            const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
                fullText += pageText + '\n';
            }

            const text = this.cleanText(fullText);

            this.logger.log(`Extracted text length: ${text.length} characters`);
            
            return text;
        } catch (error) {
            this.logger.error(`Error extracting text from PDF: ${error.message}`);
            throw error;
        }
    }

    private cleanText(text: string): string {
        return text
            .replace(/\r\n/g, '\n')           
            .replace(/\n{3,}/g, '\n\n')       
            .replace(/[ \t]+/g, ' ')         
            .replace(/^\s+|\s+$/gm, '')       
            .trim();
    }

    async extractCvStructure(filepath: string): Promise<{
        text: string;
        sections: Record<string, string>;
    }> {
        const text = await this.extractText(filepath);

        const sections: Record<string, string> = {};
        const sectionHeaders = [
            'experience',
            'education',
            'skills',
            'projects',
            'achievements',
            'summary',
        ]

        const lines = text.split('\n');
        let currentSection= 'general';
        let currentContent: string[] = [];

        for (const line of lines) {
            const lowerLine = line.toLowerCase().trim();

            const matchedSection = sectionHeaders.find(header => lowerLine.includes(header));

            if (matchedSection) {
                if (currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }

                currentSection = matchedSection;
                currentContent = [];
            }else{
                currentContent.push(line);
            }
        }

        if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
        }
        
        return {
            text,
            sections,
        };
    }

    async validatePdf(filepath: string): Promise<boolean> {
        try {
            this.logger.log(`Validating PDF file at path: ${filepath}`);

            const dataBuffer = await fs.readFile(filepath);

            const header = dataBuffer.slice(0, 5).toString();
            if (!header.startsWith('%PDF')) {
                return false
            }

            await pdfjsLib.getDocument({ data: dataBuffer }).promise;

            return true;
        } catch(e) {
            return false;
        } 
    }
}