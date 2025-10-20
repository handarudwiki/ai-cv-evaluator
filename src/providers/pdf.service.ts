import { Injectable, Logger } from "@nestjs/common";
import * as fs from 'fs/promises';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    async extractText(filepath: string): Promise<string> {
        try {
            this.logger.log(`Reading PDF file from path: ${filepath}`);

            const dataBuffer = await fs.readFile(filepath);

            const data = await pdfParse(dataBuffer);

            const text = this.cleanText(data.text);

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
        sections: Record<string, string[]>;
    }> {
        const text = await this.extractText(filepath);

        const sections: Record<string, string[]> = {};
        const sectionHeaders = [
            'experience',
            'education',
            'skills',
            'projects',
            'achievements',
            'summary',
        ]

        const lines = text.split('\n');
        let currentSection: 'general';
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

            await pdfParse(dataBuffer);

            return true;
        } catch(e) {
            return false;
        } 
}