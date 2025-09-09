#!/usr/bin/env node
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

// Canonical naming for this server
const CANONICAL_ID = 'gemini-nanobanana-mcp';
const CANONICAL_DISPLAY = 'Gemini Nanobanana MCP';

// Env
const MCP_NAME = process.env.MCP_NAME ?? CANONICAL_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GEMINI_ENDPOINT =
  process.env.GEMINI_IMAGE_ENDPOINT ??
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

// Default save paths
const DEFAULT_SAVE_DIR = process.env.DEFAULT_SAVE_DIR ?? '~/Downloads/gemini-images';
const AUTO_SAVE = (process.env.AUTO_SAVE ?? 'true').toLowerCase() === 'true';

// HTTP Security Configuration
const MCP_HTTP_HOST = process.env.MCP_HTTP_HOST ?? '127.0.0.1';
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB limit

// Retry Configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 60000; // 60 seconds

// Input Validation Configuration
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'] as const;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_BASE64_SIZE = Math.ceil((MAX_IMAGE_SIZE * 4) / 3); // Base64 is ~33% larger

// Logging Configuration
const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;
const CURRENT_LOG_LEVEL = LOG_LEVELS[LOG_LEVEL as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.info;

// Structured logging utilities (moved up before first usage)
interface LogContext {
  tool?: string;
  requestId?: string;
  duration?: number;
  status?: string | number;
  error?: string;
  [key: string]: unknown;
}

function createLogger(level: keyof typeof LOG_LEVELS) {
  return (message: string, context: LogContext = {}) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS[level]) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        service: CANONICAL_ID,
        message,
        ...context,
      };

      console.error(JSON.stringify(logEntry));
    }
  };
}

const logger = {
  error: createLogger('error'),
  warn: createLogger('warn'),
  info: createLogger('info'),
  debug: createLogger('debug'),
};

if (!GEMINI_API_KEY) {
  logger.error('Missing GEMINI_API_KEY environment variable', {
    service: CANONICAL_DISPLAY,
    required: true,
    suggestion: 'Set GEMINI_API_KEY environment variable with your Google AI Studio API key',
  });
}

// Utility functions for error handling and retries
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

function calculateDelay(attempt: number): number {
  return BASE_DELAY * Math.pow(2, attempt) + Math.random() * 1000; // Exponential backoff with jitter
}

// Input validation utilities
function validateMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType.toLowerCase());
}

function validateBase64Size(base64: string): boolean {
  return base64.length <= MAX_BASE64_SIZE;
}

function validateFilePath(path: string): boolean {
  // Prevent path traversal attacks
  const normalizedPath = resolve(path);
  const basePath = resolve('.');
  return normalizedPath.startsWith(basePath) && !path.includes('..') && !path.includes('~');
}

function generateDefaultFileName(tool: string, mimeType: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
  const date = timestamp[0];
  const time = timestamp[1].split('.')[0];

  const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';

  // Expand tilde in default directory
  const expandedDir = DEFAULT_SAVE_DIR.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '.');

  return `${expandedDir}/${tool}-${date}-${time}.${extension}`;
}

type InlineImageInput = {
  dataBase64?: string; // base64 without data URL prefix
  path?: string; // absolute or relative path to image
  mimeType?: string; // e.g., image/png, image/jpeg
};

type GenerateRequest = {
  prompt: string;
  images?: InlineImageInput[]; // optional; when provided, treated as editing/composition
  mimeType?: string; // preferred output mime (hint)
  saveToFilePath?: string; // optional absolute/relative path to save
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { data?: string; mimeType?: string };
        text?: string;
      }>;
    };
  }>;
};

async function fileToBase64(pathOrRelative: string): Promise<string> {
  const full = resolve(pathOrRelative);
  const buf = await readFile(full);
  return buf.toString('base64');
}

async function toInlineDataParts(
  inputs: InlineImageInput[] | undefined
): Promise<Array<{ inline_data: { mime_type: string; data: string } }>> {
  if (!inputs || inputs.length === 0) return [];
  const parts: Array<{ inline_data: { mime_type: string; data: string } }> = [];
  for (const input of inputs) {
    const mime = input.mimeType ?? 'image/png';
    let dataBase64 = input.dataBase64;
    if (!dataBase64 && input.path) {
      dataBase64 = await fileToBase64(input.path);
    }
    if (!dataBase64) {
      throw new Error('InlineImageInput requires either dataBase64 or path');
    }
    parts.push({ inline_data: { mime_type: mime, data: dataBase64 } });
  }
  return parts;
}

async function callGeminiGenerate(request: GenerateRequest): Promise<{ imageBase64: string; mimeType: string }[]> {
  // Validate API key first
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    throw new Error('GEMINI_API_KEY environment variable is required but not set or empty');
  }

  const textPart = { text: request.prompt };
  const imageParts = await toInlineDataParts(request.images);
  const parts = [textPart, ...imageParts];

  const requestBody = JSON.stringify({
    contents: [
      {
        parts,
      },
    ],
  });

  logger.debug('Sending request to Gemini API', {
    endpoint: GEMINI_ENDPOINT,
    hasApiKey: !!GEMINI_API_KEY,
    bodySize: requestBody.length,
    parts: parts.length,
    prompt: request.prompt.substring(0, 100) + (request.prompt.length > 100 ? '...' : ''),
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const fetchResponse = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      logger.debug('Received response from Gemini API', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        attempt: attempt + 1,
      });

      if (fetchResponse.ok) {
        const json = (await fetchResponse.json()) as GeminiGenerateResponse;
        const images: { imageBase64: string; mimeType: string }[] = [];
        const first = json.candidates?.[0]?.content?.parts ?? [];

        logger.debug('Processing API response', {
          candidatesCount: json.candidates?.length ?? 0,
          partsCount: first.length,
        });

        for (const part of first) {
          if (part.inlineData?.data) {
            images.push({ imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType ?? 'image/png' });
          }
        }

        if (images.length === 0) {
          logger.error('No image data in API response', {
            response: JSON.stringify(json, null, 2).substring(0, 1000),
          });
          throw new Error('No image data returned by Gemini API');
        }

        logger.debug('Successfully extracted images', {
          imageCount: images.length,
          firstImageSize: images[0]?.imageBase64?.length ?? 0,
        });

        return images;
      }

      // Handle error responses
      const errorText = await fetchResponse.text();
      logger.error('Gemini API error response', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        errorText: errorText.substring(0, 500),
        attempt: attempt + 1,
      });

      const error = new Error(`Gemini API error ${fetchResponse.status}: ${errorText}`);

      if (!shouldRetry(fetchResponse.status) || attempt === MAX_RETRIES) {
        throw error;
      }

      lastError = error;
      const delay = calculateDelay(attempt);
      logger.warn('API request failed, retrying', {
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
        status: fetchResponse.status,
        retryInMs: delay,
        tool: 'callGeminiGenerate',
      });
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Request timed out after ${REQUEST_TIMEOUT / 1000} seconds`);
      }

      if (attempt === MAX_RETRIES) {
        throw err;
      }

      lastError = err as Error;
      logger.warn('Request failed with exception, retrying', {
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
        error: (err as Error).message,
        tool: 'callGeminiGenerate',
      });
    }

    if (attempt < MAX_RETRIES) {
      await sleep(calculateDelay(attempt));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

async function maybeSaveImage(base64: string, mimeType: string, targetPath?: string): Promise<string | undefined> {
  if (!targetPath) return undefined;

  try {
    logger.debug('Starting image save process', {
      targetPath,
      mimeType,
      base64Length: base64.length,
    });

    const { writeFile, mkdir, access } = await import('node:fs/promises');
    const { extname, dirname, basename, join } = await import('node:path');

    // Determine extension from MIME type
    const mimeToExt: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };

    const detectedExt = mimeToExt[mimeType.toLowerCase()] || '.png';
    const providedExt = extname(targetPath);
    const extension = providedExt || detectedExt;

    // Prepare base path
    const basePath = providedExt ? targetPath : `${targetPath}${extension}`;
    const resolved = resolve(basePath);
    const dir = dirname(resolved);
    const name = basename(resolved, extension);

    logger.debug('File path resolution', {
      originalPath: targetPath,
      basePath,
      resolved,
      dir,
      name,
      extension,
    });

    // Create directory if it doesn't exist
    try {
      await mkdir(dir, { recursive: true });
      logger.debug('Directory created or already exists', { dir });
    } catch (err) {
      logger.error('Failed to create directory', {
        dir,
        error: (err as Error).message,
      });
      throw new Error(`Failed to create directory: ${(err as Error).message}`);
    }

    // Handle file name collision
    let finalPath = resolved;
    let counter = 0;

    while (true) {
      try {
        await access(finalPath);
        // File exists, try with number suffix
        counter++;
        finalPath = join(dir, `${name}_${counter}${extension}`);
        logger.debug('File exists, trying with suffix', {
          existingPath: finalPath.replace(`_${counter}`, ''),
          newPath: finalPath,
          counter,
        });
      } catch {
        // File doesn't exist, we can use this path
        logger.debug('Final path determined', { finalPath });
        break;
      }
    }

    const buffer = Buffer.from(base64, 'base64');
    logger.debug('Writing image buffer', {
      bufferSize: buffer.length,
      finalPath,
    });

    await writeFile(finalPath, buffer);

    logger.info('Image saved successfully', {
      path: finalPath,
      sizeKB: Math.round(buffer.length / 1024),
    });

    return finalPath;
  } catch (error) {
    logger.error('Image save failed', {
      targetPath,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new Error(`Failed to save image: ${(error as Error).message}`);
  }
}

const mcp = new McpServer({ name: MCP_NAME, version: '0.1.0' });

// Tool: generate_image (text-to-image)
mcp.tool(
  'generate_image',
  'Generate an image from a text prompt using Gemini 2.5 Flash Image',
  {
    prompt: z
      .string()
      .min(1)
      .max(2000)
      .describe('Detailed scene description. Use photographic terms for photorealism.'),
    saveToFilePath: z
      .string()
      .optional()
      .refine((path) => !path || validateFilePath(path), {
        message: 'Invalid file path - path traversal not allowed',
      })
      .describe('Optional path to save the image (png/jpeg by extension)'),
  },
  async (args) => {
    const requestId = randomUUID();
    const startTime = Date.now();

    try {
      logger.debug('Starting image generation', {
        tool: 'generate_image',
        requestId,
        promptLength: args.prompt?.length,
        hasFilePath: !!args.saveToFilePath,
      });

      const { prompt, saveToFilePath } = args;
      const results = await callGeminiGenerate({ prompt, saveToFilePath });
      const first = results[0];

      // Use default file path if AUTO_SAVE is enabled and no path provided
      const finalSavePath =
        saveToFilePath || (AUTO_SAVE ? generateDefaultFileName('generate', first.mimeType) : undefined);
      const savedPath = await maybeSaveImage(first.imageBase64, first.mimeType, finalSavePath);

      const duration = Date.now() - startTime;
      logger.info('Image generated successfully', {
        tool: 'generate_image',
        requestId,
        duration,
        savedTo: savedPath,
        mimeType: first.mimeType,
        imageSizeKB: Math.round((first.imageBase64.length * 0.75) / 1024),
      });

      // Optimize response to avoid token limit issues
      const responseContent: any[] = [
        {
          type: 'text',
          text: savedPath
            ? `✅ Image generated and saved to: ${savedPath}\n📏 Size: ${Math.round((first.imageBase64.length * 0.75) / 1024)}KB\n📄 Format: ${first.mimeType}${!args.saveToFilePath ? '\n🔄 Auto-saved (set AUTO_SAVE=false to disable)' : ''}`
            : `✅ Image generated successfully!\n📏 Size: ${Math.round((first.imageBase64.length * 0.75) / 1024)}KB\n📄 Format: ${first.mimeType}\n\n💡 To save the image, add saveToFilePath parameter or enable AUTO_SAVE`,
        },
      ];

      // Only include image data if no file was saved (for viewing in client)
      if (!savedPath) {
        responseContent.push({ type: 'image', mimeType: first.mimeType, data: first.imageBase64 });
      }

      return { content: responseContent };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Image generation failed', {
        tool: 'generate_image',
        requestId,
        duration,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });

      // Return user-friendly error message
      throw new Error(`Failed to generate image: ${(error as Error).message}`);
    }
  }
);

// Tool: edit_image (text + image to image)
mcp.tool(
  'edit_image',
  'Edit an image using a prompt. Provide one input image via base64 or file path.',
  {
    prompt: z.string().min(1).max(2000).describe('Describe the edit; the model matches original style and lighting.'),
    image: z
      .object({
        dataBase64: z
          .string()
          .optional()
          .refine((data) => !data || validateBase64Size(data), {
            message: `Base64 data too large (max ${MAX_BASE64_SIZE / 1024 / 1024}MB)`,
          })
          .describe('Base64 without data URL prefix'),
        path: z
          .string()
          .optional()
          .refine((path) => !path || validateFilePath(path), {
            message: 'Invalid file path - path traversal not allowed',
          })
          .describe('Path to the input image file'),
        mimeType: z
          .string()
          .optional()
          .refine((mime) => !mime || validateMimeType(mime), {
            message: `Unsupported MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
          })
          .describe('image/png, image/jpeg, image/webp, image/gif'),
      })
      .refine((data) => data.dataBase64 || data.path, {
        message: 'Either dataBase64 or path must be provided',
      })
      .describe('One input image'),
    saveToFilePath: z
      .string()
      .optional()
      .refine((path) => !path || validateFilePath(path), {
        message: 'Invalid file path - path traversal not allowed',
      })
      .describe('Optional path to save the edited image'),
  },
  async (args) => {
    const { prompt, image, saveToFilePath } = args as {
      prompt: string;
      image: InlineImageInput;
      saveToFilePath?: string;
    };
    const results = await callGeminiGenerate({ prompt, images: [image] });
    const first = results[0];

    // Use default file path if AUTO_SAVE is enabled and no path provided
    const finalSavePath = saveToFilePath || (AUTO_SAVE ? generateDefaultFileName('edit', first.mimeType) : undefined);
    const savedPath = await maybeSaveImage(first.imageBase64, first.mimeType, finalSavePath);

    const responseContent: any[] = [
      {
        type: 'text',
        text: savedPath
          ? `✅ Image edited and saved to: ${savedPath}\n📏 Size: ${Math.round((first.imageBase64.length * 0.75) / 1024)}KB\n📄 Format: ${first.mimeType}${!saveToFilePath ? '\n🔄 Auto-saved (set AUTO_SAVE=false to disable)' : ''}`
          : `✅ Image edited successfully!\n📏 Size: ${Math.round((first.imageBase64.length * 0.75) / 1024)}KB\n📄 Format: ${first.mimeType}`,
      },
    ];

    if (!savedPath) {
      responseContent.push({ type: 'image', mimeType: first.mimeType, data: first.imageBase64 });
    }

    return { content: responseContent };
  }
);

// Tool: compose_images (combine multiple images with prompt)
mcp.tool(
  'compose_images',
  'Compose a new image using multiple input images and a guiding prompt.',
  {
    prompt: z.string().min(1).max(2000).describe('Describe how to compose the elements of the input images.'),
    images: z
      .array(
        z
          .object({
            dataBase64: z
              .string()
              .optional()
              .refine((data) => !data || validateBase64Size(data), {
                message: `Base64 data too large (max ${MAX_BASE64_SIZE / 1024 / 1024}MB)`,
              }),
            path: z
              .string()
              .optional()
              .refine((path) => !path || validateFilePath(path), {
                message: 'Invalid file path - path traversal not allowed',
              }),
            mimeType: z
              .string()
              .optional()
              .refine((mime) => !mime || validateMimeType(mime), {
                message: `Unsupported MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
              }),
          })
          .refine((data) => data.dataBase64 || data.path, {
            message: 'Either dataBase64 or path must be provided for each image',
          })
      )
      .min(2)
      .max(10),
    saveToFilePath: z
      .string()
      .optional()
      .refine((path) => !path || validateFilePath(path), {
        message: 'Invalid file path - path traversal not allowed',
      })
      .describe('Optional path to save the composed image'),
  },
  async (args) => {
    const { prompt, images, saveToFilePath } = args as {
      prompt: string;
      images: InlineImageInput[];
      saveToFilePath?: string;
    };
    const results = await callGeminiGenerate({ prompt, images });
    const first = results[0];

    // Use default file path if AUTO_SAVE is enabled and no path provided
    const finalSavePath =
      saveToFilePath || (AUTO_SAVE ? generateDefaultFileName('compose', first.mimeType) : undefined);
    const savedPath = await maybeSaveImage(first.imageBase64, first.mimeType, finalSavePath);

    const responseContent: any[] = [
      {
        type: 'text',
        text: savedPath
          ? `✅ Images composed and saved to: ${savedPath}\n📏 Size: ${Math.round((first.imageBase64.length * 0.75) / 1024)}KB\n📄 Format: ${first.mimeType}${!saveToFilePath ? '\n🔄 Auto-saved (set AUTO_SAVE=false to disable)' : ''}`
          : `✅ Images composed successfully!\n📏 Size: ${Math.round((first.imageBase64.length * 0.75) / 1024)}KB\n📄 Format: ${first.mimeType}`,
      },
    ];

    if (!savedPath) {
      responseContent.push({ type: 'image', mimeType: first.mimeType, data: first.imageBase64 });
    }

    return { content: responseContent };
  }
);

// Tool: style_transfer (apply style image to base image)
mcp.tool(
  'style_transfer',
  'Transfer style from a style image to a base image, guided by an optional prompt.',
  {
    prompt: z
      .string()
      .optional()
      .refine((text) => !text || (text.length >= 1 && text.length <= 2000), {
        message: 'Prompt must be between 1 and 2000 characters',
      })
      .describe('Optional additional instruction for the style transfer.'),
    baseImage: z
      .object({
        dataBase64: z
          .string()
          .optional()
          .refine((data) => !data || validateBase64Size(data), {
            message: `Base64 data too large (max ${MAX_BASE64_SIZE / 1024 / 1024}MB)`,
          }),
        path: z
          .string()
          .optional()
          .refine((path) => !path || validateFilePath(path), {
            message: 'Invalid file path - path traversal not allowed',
          }),
        mimeType: z
          .string()
          .optional()
          .refine((mime) => !mime || validateMimeType(mime), {
            message: `Unsupported MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
          }),
      })
      .refine((data) => data.dataBase64 || data.path, {
        message: 'Either dataBase64 or path must be provided for base image',
      }),
    styleImage: z
      .object({
        dataBase64: z
          .string()
          .optional()
          .refine((data) => !data || validateBase64Size(data), {
            message: `Base64 data too large (max ${MAX_BASE64_SIZE / 1024 / 1024}MB)`,
          }),
        path: z
          .string()
          .optional()
          .refine((path) => !path || validateFilePath(path), {
            message: 'Invalid file path - path traversal not allowed',
          }),
        mimeType: z
          .string()
          .optional()
          .refine((mime) => !mime || validateMimeType(mime), {
            message: `Unsupported MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
          }),
      })
      .refine((data) => data.dataBase64 || data.path, {
        message: 'Either dataBase64 or path must be provided for style image',
      }),
    saveToFilePath: z
      .string()
      .optional()
      .refine((path) => !path || validateFilePath(path), {
        message: 'Invalid file path - path traversal not allowed',
      })
      .describe('Optional path to save the output'),
  },
  async (args) => {
    const {
      prompt = 'Apply the style of the second image to the first image while preserving the original content',
      baseImage,
      styleImage,
      saveToFilePath,
    } = args as { prompt?: string; baseImage: InlineImageInput; styleImage: InlineImageInput; saveToFilePath?: string };
    const results = await callGeminiGenerate({ prompt, images: [baseImage, styleImage] });
    const first = results[0];

    // Use default file path if AUTO_SAVE is enabled and no path provided
    const finalSavePath = saveToFilePath || (AUTO_SAVE ? generateDefaultFileName('style', first.mimeType) : undefined);
    const savedPath = await maybeSaveImage(first.imageBase64, first.mimeType, finalSavePath);

    const responseContent: any[] = [
      {
        type: 'text',
        text: savedPath
          ? `✅ Style transferred and saved to: ${savedPath}\n📏 Size: ${Math.round((first.imageBase64.length * 0.75) / 1024)}KB\n📄 Format: ${first.mimeType}${!saveToFilePath ? '\n🔄 Auto-saved (set AUTO_SAVE=false to disable)' : ''}`
          : `✅ Style transfer completed!\n📏 Size: ${Math.round((first.imageBase64.length * 0.75) / 1024)}KB\n📄 Format: ${first.mimeType}`,
      },
    ];

    if (!savedPath) {
      responseContent.push({ type: 'image', mimeType: first.mimeType, data: first.imageBase64 });
    }

    return { content: responseContent };
  }
);

async function main() {
  const transportMode = (process.env.MCP_TRANSPORT ?? 'stdio').toLowerCase();
  if (transportMode === 'http') {
    const port = Number(process.env.MCP_HTTP_PORT ?? 7801);
    const path = process.env.MCP_HTTP_PATH ?? '/mcp';
    const enableJson = (process.env.MCP_HTTP_ENABLE_JSON ?? 'false').toLowerCase() === 'true';
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: enableJson,
    });

    await mcp.connect(transport);

    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url?.startsWith(path)) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        let parsedBody: unknown = undefined;
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          let totalSize = 0;

          for await (const chunk of req) {
            totalSize += (chunk as Buffer).length;
            if (totalSize > MAX_BODY_SIZE) {
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Payload Too Large', maxSize: `${MAX_BODY_SIZE / 1024 / 1024}MB` }));
              return;
            }
            chunks.push(chunk as Buffer);
          }

          const raw = Buffer.concat(chunks).toString('utf8');
          try {
            parsedBody = raw ? JSON.parse(raw) : undefined;
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }
        }
        await transport.handleRequest(req, res, parsedBody);
      } catch (err) {
        logger.error('HTTP request processing failed', {
          error: (err as Error).message,
          url: req.url,
          method: req.method,
          transport: 'http',
        });
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    });

    server.listen(port, MCP_HTTP_HOST, () => {
      logger.info('HTTP transport started successfully', {
        host: MCP_HTTP_HOST,
        port,
        path,
        url: `http://${MCP_HTTP_HOST}:${port}${path}`,
        transport: 'http',
        enableJson,
      });
    });
  } else {
    logger.info('STDIO transport started successfully', {
      transport: 'stdio',
      serverName: MCP_NAME,
    });
    await mcp.connect(new StdioServerTransport());
  }
}

main().catch((err) => {
  logger.error('Fatal error during startup', {
    error: (err as Error).message,
    stack: (err as Error).stack,
    fatal: true,
  });
  process.exit(1);
});
