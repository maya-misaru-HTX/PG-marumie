import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Storage } from '@google-cloud/storage';

// Configure route to handle larger file uploads (up to 20MB)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large PDF processing

// Google Cloud Vision API
// Supports files up to 20MB with excellent Japanese OCR
// First 1,000 pages per month are free
// Credentials should be set via GOOGLE_APPLICATION_CREDENTIALS env variable
// or inline credentials via GOOGLE_CREDENTIALS env variable

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `ファイルサイズが大きすぎます。20MB以下のファイルをアップロードしてください。` },
        { status: 400 }
      );
    }

    // Initialize Google Cloud Vision client
    let client: ImageAnnotatorClient;

    try {
      // Try to use credentials from environment variable
      if (process.env.GOOGLE_CREDENTIALS) {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        client = new ImageAnnotatorClient({
          credentials,
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Use default credentials from file path
        client = new ImageAnnotatorClient();
      } else {
        // Fallback: Use OCR.space API if no Google credentials
        return await fallbackToOCRSpace(file);
      }
    } catch (credError) {
      console.warn('Google Vision credentials not configured, falling back to OCR.space:', credError);
      return await fallbackToOCRSpace(file);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if file is PDF
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      // For PDFs, use async PDF annotation with Cloud Storage
      console.log('PDF detected, using async OCR with Cloud Storage...');
      return await processPDFAsync(file, buffer, client);
    } else {
      // Process single image file
      const [result] = await client.documentTextDetection({
        image: { content: buffer },
        imageContext: {
          languageHints: ['ja', 'en'], // Japanese and English
        },
      });

      const detections = result.fullTextAnnotation;
      const extractedText = detections?.text || '';

      return NextResponse.json({
        success: true,
        text: extractedText,
        pageCount: 1,
      });
    }

  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '文字認識中にエラーが発生しました' },
      { status: 500 }
    );
  }
}


// Process PDF using async API with Cloud Storage
async function processPDFAsync(file: File, buffer: Buffer, visionClient: ImageAnnotatorClient) {
  try {
    console.log(`\n========================================`);
    console.log(`Processing PDF: ${file.name}`);
    console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB (${file.size} bytes)`);
    console.log(`========================================`);

    // Initialize Storage client with same credentials
    let storageClient: Storage;
    if (process.env.GOOGLE_CREDENTIALS) {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      storageClient = new Storage({ credentials });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      storageClient = new Storage();
    } else {
      throw new Error('Google Cloud credentials not configured');
    }

    // Use project ID from credentials or environment
    const credentials = process.env.GOOGLE_CREDENTIALS
      ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
      : null;
    const projectId = credentials?.project_id || process.env.GOOGLE_CLOUD_PROJECT;

    if (!projectId) {
      throw new Error('Google Cloud project ID not found in credentials');
    }

    // Create or use existing bucket for temporary files
    const bucketName = process.env.GCS_BUCKET_NAME || `${projectId}-ocr-temp`;
    console.log(`Using bucket: ${bucketName}`);

    let bucket = storageClient.bucket(bucketName);

    // Try to create bucket if it doesn't exist
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.log(`Creating bucket: ${bucketName}`);
        [bucket] = await storageClient.createBucket(bucketName, {
          location: 'US',
          storageClass: 'STANDARD',
        });
      }
    } catch (bucketError) {
      console.warn('Bucket creation/check error:', bucketError);
      // Continue anyway - bucket might exist but we don't have permission to check
    }

    // Upload PDF to Cloud Storage
    const timestamp = Date.now();
    const inputFileName = `input/${timestamp}-${file.name}`;
    const outputPrefix = `output/${timestamp}/`;

    console.log(`Uploading to GCS: ${inputFileName}`);
    const inputFile = bucket.file(inputFileName);
    await inputFile.save(buffer, {
      contentType: file.type,
      metadata: {
        cacheControl: 'no-cache',
      },
    });

    const gcsSourceUri = `gs://${bucketName}/${inputFileName}`;
    const gcsDestinationUri = `gs://${bucketName}/${outputPrefix}`;

    console.log(`Starting async OCR: ${gcsSourceUri} -> ${gcsDestinationUri}`);

    // Start async PDF annotation
    // Using batchSize: 1 to ensure each page is processed individually
    // This prevents pages from being skipped or grouped incorrectly
    const [operation] = await visionClient.asyncBatchAnnotateFiles({
      requests: [{
        inputConfig: {
          gcsSource: { uri: gcsSourceUri },
          mimeType: 'application/pdf',
        },
        features: [
          { type: 'DOCUMENT_TEXT_DETECTION' }
        ],
        outputConfig: {
          gcsDestination: { uri: gcsDestinationUri },
          batchSize: 1, // Process 1 page per output file for maximum accuracy
        },
        imageContext: {
          languageHints: ['ja', 'en'], // Japanese and English for better OCR
        },
      }],
    });

    console.log('Waiting for OCR to complete...');
    const [result] = await operation.promise();

    console.log('OCR complete!');
    console.log(`Operation result metadata: ${JSON.stringify(result?.metadata || {}, null, 2)}`);
    console.log('Reading results from GCS...');

    // Read output files from GCS
    const [files] = await bucket.getFiles({ prefix: outputPrefix });
    console.log(`Found ${files.length} output files`);

    let allText = '';
    let pageCount = 0;
    let processedFileCount = 0;

    for (const outputFile of files) {
      if (outputFile.name.endsWith('.json')) {
        processedFileCount++;
        console.log(`Processing output file ${processedFileCount}: ${outputFile.name}`);

        const [content] = await outputFile.download();
        const jsonResult = JSON.parse(content.toString());

        console.log(`  - Response count: ${jsonResult.responses?.length || 0}`);

        if (jsonResult.responses) {
          for (let i = 0; i < jsonResult.responses.length; i++) {
            const response = jsonResult.responses[i];

            if (response.fullTextAnnotation) {
              const textLength = response.fullTextAnnotation.text?.length || 0;
              const pagesInResponse = response.fullTextAnnotation.pages?.length || 1;

              console.log(`  - Response ${i + 1}: ${textLength} chars, ${pagesInResponse} page(s)`);

              // Extract structured text with better formatting
              let structuredText = '';

              // Try to preserve structure by extracting paragraphs/blocks
              if (response.fullTextAnnotation.pages) {
                for (const page of response.fullTextAnnotation.pages) {
                  if (page.blocks) {
                    for (const block of page.blocks) {
                      if (block.paragraphs) {
                        for (const paragraph of block.paragraphs) {
                          let paragraphText = '';
                          if (paragraph.words) {
                            for (const word of paragraph.words) {
                              if (word.symbols) {
                                const wordText = word.symbols
                                  .map((symbol: any) => symbol.text)
                                  .join('');
                                paragraphText += wordText + ' ';
                              }
                            }
                          }
                          structuredText += paragraphText.trim() + '\n';
                        }
                      }
                    }
                    structuredText += '\n'; // Add space between blocks
                  }
                }
              }

              // Fallback to simple text if structured extraction fails
              const textToUse = structuredText.trim() || response.fullTextAnnotation.text || '';
              allText += textToUse + '\n\n';
              pageCount += pagesInResponse;
            } else {
              console.warn(`  - Response ${i + 1}: No fullTextAnnotation found`);
              console.warn(`  - Available keys: ${Object.keys(response).join(', ')}`);
            }
          }
        } else {
          console.warn(`  - No responses array found in JSON`);
        }
      }
    }

    console.log(`Summary: Extracted ${allText.length} characters from ${pageCount} pages across ${processedFileCount} output files`);

    // Clean up temporary files
    console.log('Cleaning up temporary files...');
    try {
      await inputFile.delete();
      for (const outputFile of files) {
        await outputFile.delete();
      }
    } catch (cleanupError) {
      console.warn('Cleanup error (non-fatal):', cleanupError);
    }

    return NextResponse.json({
      success: true,
      text: allText || '（PDFから文字を抽出できませんでした）',
      pageCount: pageCount,
    });

  } catch (error) {
    console.error('Async PDF processing error:', error);
    return NextResponse.json(
      { error: `PDF処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` },
      { status: 500 }
    );
  }
}

// Fallback to OCR.space for users without Google Cloud credentials
async function fallbackToOCRSpace(file: File) {
  try {
    const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'K87899142388957';

    // Create form data for OCR.space API
    const ocrFormData = new FormData();
    ocrFormData.append('file', file);
    ocrFormData.append('language', 'jpn');
    ocrFormData.append('isTable', 'true');
    ocrFormData.append('OCREngine', '2');
    ocrFormData.append('scale', 'true');
    ocrFormData.append('isCreateSearchablePdf', 'false');
    ocrFormData.append('detectOrientation', 'true');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': OCR_SPACE_API_KEY,
      },
      body: ocrFormData,
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      return NextResponse.json(
        { error: data.ErrorMessage || '文字認識に失敗しました（OCR.space 無料版: 1MB制限）' },
        { status: 500 }
      );
    }

    const extractedText = data.ParsedResults?.map((result: any) => result.ParsedText).join('\n\n') || '';

    return NextResponse.json({
      success: true,
      text: extractedText,
      pageCount: data.ParsedResults?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: '文字認識に失敗しました' },
      { status: 500 }
    );
  }
}
