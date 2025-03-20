import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { existsSync, promises as fsPromises, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { DOWNLOAD_DIR } from './constants';

/**
 * Extracts text from a PDF file.
 * @param file - The uploaded PDF file.
 * @returns A promise that resolves to the extracted text.
 * @throws {BadRequestException} If text extraction fails.
 */
export async function extractTextFromPdf(
  file: Express.Multer.File,
): Promise<string> {
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
 * @param file - The uploaded DOCX file.
 * @returns A promise that resolves to the extracted text.
 * @throws {BadRequestException} If text extraction fails.
 */
export async function extractTextFromDocx(
  file: Express.Multer.File,
): Promise<string> {
  try {
    const { value: text } = await mammoth.extractRawText({
      buffer: file.buffer,
    });
    return text;
  } catch (error) {
    console.error('error: ', error);
    throw new BadRequestException('Failed to extract text from DOCX.');
  }
}

/**
 * Generates a unique filename for audio files.
 * @returns A string representing a unique filename.
 */
export function generateAudioFilename(): string {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${dateString}_${randomString}`;
}

/**
 * Cleans up old files in a specified directory.
 * @param dirPath - The path to the directory to clean.
 * @param maxAgeMs - The maximum age of files to keep in milliseconds.
 */
export async function cleanupOldFiles(
  dirPath: string,
  maxAgeMs: number,
): Promise<void> {
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
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}: `, error);
      }
    }
  } catch (error) {
    console.error('Error reading directory: ', error);
  }
}

export async function cleanUpFile(filePath: string) {
  try {
    await fsPromises.unlink(filePath);
  } catch (cleanupError) {
    console.error('Failed to clean up file after error:', cleanupError);
  }
}

export function ensureDownloadDirectory() {
  if (!existsSync(DOWNLOAD_DIR)) {
    mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
}

/**
 * Extracts text from different file formats.
 * @param file - The uploaded file (PDF, DOCX, or TXT).
 * @returns The extracted text from the file.
 * @throws UnsupportedMediaTypeException if the file format is not supported.
 */
export async function extractTextFromFile(
  file: Express.Multer.File,
): Promise<string> {
  const ext = extname(file.originalname).toLowerCase();

  switch (ext) {
    case '.txt':
      return file.buffer.toString('utf-8'); // Read plain text file

    case '.pdf':
      return extractTextFromPdf(file);

    case '.docx':
      return extractTextFromDocx(file);

    default:
      throw new UnsupportedMediaTypeException(
        'Unsupported file format. Only PDF, TXT, and DOCX are allowed.',
      );
  }
}
