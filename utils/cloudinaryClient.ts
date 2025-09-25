// app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Types
interface UploadRequest {
  dataUrl?: string;
}

interface CloudinaryResponse {
  secure_url?: string;
  url: string;
  public_id: string;
}

interface UploadResponse {
  url: string;
  public_id: string;
}

interface ErrorResponse {
  error: string;
}

// Configure cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Validate cloudinary configuration */
function validateCloudinaryConfig(): void {
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

/** Validate data URL format */
function validateDataUrl(dataUrl: string): void {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL format - must start with "data:"');
  }

  // Basic data URL pattern validation
  const dataUrlPattern = /^data:([a-zA-Z0-9][a-zA-Z0-9\/+]*);base64,([a-zA-Z0-9+\/]+=*)$/;
  if (!dataUrlPattern.test(dataUrl)) {
    throw new Error('Invalid data URL format');
  }

  // Check if it's an image
  const mimeType = dataUrl.split(';')[0].split(':')[1];
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`);
  }
}

/** Error handler */
function handleError(error: unknown): NextResponse<ErrorResponse> {
  const message = error instanceof Error ? error.message : 'Upload failed';
  console.error("Upload error:", error);
  
  return NextResponse.json({ 
    error: message 
  }, { status: 500 });
}

/** POST - Upload image to Cloudinary */
export async function POST(req: NextRequest): Promise<NextResponse<UploadResponse | ErrorResponse>> {
  try {
    // Validate cloudinary configuration
    validateCloudinaryConfig();

    // Parse request body
    const body = await req.json().catch(() => ({})) as UploadRequest;
    const { dataUrl } = body;

    // Validate required fields
    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json({ 
        error: "dataUrl is required and must be a string" 
      }, { status: 422 });
    }

    // Validate data URL format
    validateDataUrl(dataUrl);

    // Upload to cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUrl, {
      folder: "courses",
      resource_type: "image",
      quality: "auto:best",
      fetch_format: "auto",
    }) as CloudinaryResponse;

    // Return response
    return NextResponse.json({
      url: uploadResult.secure_url || uploadResult.url,
      public_id: uploadResult.public_id,
    });

  } catch (error) {
    return handleError(error);
  }
}

/** GET - Get upload configuration */
export async function GET(): Promise<NextResponse> {
  try {
    validateCloudinaryConfig();

    return NextResponse.json({
      config: {
        folder: "courses",
        maxFileSize: "10MB",
        allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
        format: "Send as base64 data URL (data:image/jpeg;base64,<base64-string>)",
      }
    });

  } catch (error) {
    return handleError(error);
  }
}