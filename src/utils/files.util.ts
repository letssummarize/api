import { BadRequestException } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

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
