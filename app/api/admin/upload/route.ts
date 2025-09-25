// app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "../../../../lib/cloudinary";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";

// Types
interface AuthPayload {
  role: string;
  userId: string;
  email: string;
}

interface UploadRequest {
  dataUrl?: string;
  url?: string;
  file?: string;
  folder?: string;
  resourceType?: string;
}

interface CloudinaryResponse {
  secure_url?: string;
  url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  created_at: string;
}

interface UploadResponse {
  success: true;
  url: string;
  public_id: string;
  metadata?: {
    format: string;
    resourceType: string;
    width?: number;
    height?: number;
    bytes: number;
    createdAt: string;
  };
}

interface ErrorResponse {
  error: string;
  message?: string;
  details?: string;
}

/** Authentication middleware for admin-only access */
async function ensureAdmin(): Promise<AuthPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.COOKIE_NAME || "token")?.value;
  
  if (!token) {
    throw new Error("unauthenticated");
  }

  const payload = verifyToken(token) as AuthPayload | null;
  if (!payload || payload.role !== "admin") {
    throw new Error("forbidden");
  }

  return payload;
}

/** Error handler for consistent API responses */
function handleError(error: unknown, defaultMessage = "Upload failed"): NextResponse<ErrorResponse> {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error("Upload API error:", error);

  if (message === "unauthenticated") {
    return NextResponse.json({ 
      error: "Authentication required",
      message: "Please log in to upload files"
    }, { status: 401 });
  }
  
  if (message === "forbidden") {
    return NextResponse.json({ 
      error: "Admin access required",
      message: "Only administrators can upload files"
    }, { status: 403 });
  }

  return NextResponse.json({ 
    error: "Upload failed", 
    message: message,
    details: error instanceof Error ? error.stack : String(error)
  }, { status: 500 });
}

/** Validate upload request data */
function validateUploadData(body: unknown): UploadRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const request = body as UploadRequest;
  const dataUrl = request.dataUrl || request.url || request.file;
  
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("dataUrl, url, or file is required");
  }

  // Basic validation for data URL format
  if (dataUrl.startsWith("data:")) {
    const dataUrlPattern = /^data:([a-zA-Z0-9][a-zA-Z0-9\/+]*);base64,([a-zA-Z0-9+\/]+=*)$/;
    if (!dataUrlPattern.test(dataUrl)) {
      throw new Error("Invalid data URL format");
    }
  } else if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
    try {
      new URL(dataUrl);
    } catch {
      throw new Error("Invalid URL format");
    }
  } else {
    throw new Error("Data must be a valid data URL or HTTP(S) URL");
  }

  return { ...request, dataUrl };
}

/** POST - Upload image to Cloudinary */
export async function POST(req: NextRequest): Promise<NextResponse<UploadResponse | ErrorResponse>> {
  try {
    // Authenticate admin user
    await ensureAdmin();

    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const { dataUrl, folder = "rhino_courses", resourceType = "image" } = validateUploadData(body);

    // Upload to Cloudinary with security options
    const uploadOptions = {
      folder,
      resource_type: resourceType as "image" | "video" | "raw" | "auto",
      overwrite: true,
      quality: "auto:best",
      fetch_format: "auto",
      // Security: Add transformation to prevent malicious content
      transformation: resourceType === "image" ? [
        { quality: "auto:best" },
        { fetch_format: "auto" }
      ] : undefined
    };

    const cloudinaryResult = await cloudinary.uploader.upload(dataUrl as string, uploadOptions) as CloudinaryResponse;

    // Return structured response
    const response: UploadResponse = {
      success: true,
      url: cloudinaryResult.secure_url || cloudinaryResult.url,
      public_id: cloudinaryResult.public_id,
      metadata: {
        format: cloudinaryResult.format,
        resourceType: cloudinaryResult.resource_type,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        bytes: cloudinaryResult.bytes,
        createdAt: cloudinaryResult.created_at
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    return handleError(error, "Failed to upload file");
  }
}

/** GET - Get upload configuration (optional endpoint) */
export async function GET(): Promise<NextResponse> {
  try {
    await ensureAdmin();

    return NextResponse.json({
      success: true,
      config: {
        maxFileSize: "10MB",
        allowedFormats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        folder: "rhino_courses",
        supportedTypes: ["image", "video"],
        note: "Send files as base64 data URLs or HTTP(S) URLs"
      }
    });

  } catch (error) {
    return handleError(error, "Failed to get upload configuration");
  }
}

/** DELETE - Delete uploaded file (optional endpoint) */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureAdmin();

    const body = await req.json().catch(() => ({}));
    const { public_id, resource_type = "image" } = body;

    if (!public_id || typeof public_id !== "string") {
      return NextResponse.json({
        error: "Invalid request",
        message: "public_id is required"
      }, { status: 400 });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type as "image" | "video" | "raw"
    });

    return NextResponse.json({
      success: true,
      deleted: result.result === "ok",
      public_id,
      message: result.result === "ok" ? "File deleted successfully" : "File not found or already deleted"
    });

  } catch (error) {
    return handleError(error, "Failed to delete file");
  }
}