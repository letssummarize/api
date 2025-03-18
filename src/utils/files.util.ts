import { BadRequestException } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
/**
 * Extracts text from a PDF file.
 */
export async function extractTextFromPdf(file: Express.Multer.File): Promise<string> {
    try {

      const pdfData = await pdfParse(file.buffer);
      return pdfData.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new BadRequestException('Failed to extract text from PDF.');
    }
  }
  

/**
 * Extracts text from a DOCX file.
 */
export async function extractTextFromDocx(file: Express.Multer.File): Promise<string> {
  try {
    
    const { value: text } = await mammoth.extractRawText({
      buffer: file.buffer,
    });
    return text;
  } catch (error) {
    console.log('error: ', error);
    throw new BadRequestException('Failed to extract text from DOCX.');
  }
}

export function generateAudioFilename(): string {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${dateString}_${randomString}`;
}

export async function cleanupOldFiles(dirPath: string, maxAgeMs: number) {
  try {
    const files = await fsPromises.readdir(dirPath);
    const currentTime = Date.now();

    for (const file of files) {
      const filePath = join(dirPath, file);
      try {
        const stats = await fsPromises.stat(filePath);
        const fileAge = currentTime - stats.mtimeMs;
        if (fileAge > maxAgeMs) {
          await fsPromises.unlink(filePath);
          console.log(`Deleted old file: ${filePath}`);
        }
      } catch (error) {
        console.log(`Error processing file ${filePath}: `, error)
      }
    }
  } catch (error) {
    console.error('Error reading directory: ', error);
  }
}
