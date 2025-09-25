// app/api/admin/registrations/route.ts
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// Types
interface AuthPayload {
  role: string;
  userId: string;
  email: string;
}

interface RegistrationQuery {
  status?: string;
  $or?: Array<{
    [key: string]: { $regex: string; $options: string };
  }>;
}

interface RegistrationsResponse {
  ok: boolean;
  registrations: unknown[];
  total: number;
  page: number;
  limit: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  totalPages?: number;
}

interface ErrorResponse {
  error: string;
  message?: string;
}

/** Authentication middleware */
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

/** Error handler for consistent responses */
function handleError(error: unknown, defaultMessage = "An error occurred"): NextResponse<ErrorResponse> {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error("Registrations API error:", error);

  if (message === "unauthenticated") {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (message === "forbidden") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (message === "invalid_token") {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  return NextResponse.json({ 
    error: "server_error", 
    message: message 
  }, { status: 500 });
}

/** Validate and sanitize query parameters */
function parseQueryParams(url: URL) {
  const status = url.searchParams.get("status") || undefined;
  const searchQuery = url.searchParams.get("q") || undefined;
  
  // Parse and validate pagination parameters
  const rawPage = url.searchParams.get("page");
  const rawLimit = url.searchParams.get("limit");
  
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = Math.min(100, Math.max(5, Number(rawLimit) || 12));

  return { status, searchQuery, page, limit };
}

/** Build database query from parameters */
function buildSearchQuery(status?: string, searchQuery?: string): RegistrationQuery {
  const query: RegistrationQuery = {};

  // Filter by status if provided
  if (status && typeof status === "string" && status.trim()) {
    query.status = status.trim();
  }

  // Add search functionality
  if (searchQuery && typeof searchQuery === "string" && searchQuery.trim()) {
    const searchTerm = searchQuery.trim();
    query.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { "paymentProof.txnId": { $regex: searchTerm, $options: "i" } },
      { course: { $regex: searchTerm, $options: "i" } },
    ];
  }

  return query;
}

/** GET - List registrations with filtering and pagination */
export async function GET(req: NextRequest): Promise<NextResponse<RegistrationsResponse | ErrorResponse>> {
  try {
    // Authentication
    await ensureAdmin();

    // Parse query parameters
    const url = new URL(req.url);
    const { status, searchQuery, page, limit } = parseQueryParams(url);

    // Build database query
    const query = buildSearchQuery(status, searchQuery);

    // Connect to database
    await connect();

    // Execute queries in parallel for better performance
    const [total, registrations] = await Promise.all([
      Registration.countDocuments(query),
      Registration.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      ok: true,
      registrations,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage
    });

  } catch (error) {
    return handleError(error, "Failed to fetch registrations");
  }
}

/** POST - Create new registration (optional endpoint for admin) */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureAdmin();

    const body = await req.json().catch(() => ({}));

    // Basic validation
    if (!body.name || !body.email || !body.courseId) {
      return NextResponse.json({
        error: "validation_error",
        message: "Name, email, and courseId are required"
      }, { status: 422 });
    }

    await connect();

    // Create registration
    const registration = await Registration.create({
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      courseId: body.courseId,
      status: body.status || "pending",
      paid: body.paid || false,
      createdAt: new Date()
    });

    return NextResponse.json({
      ok: true,
      registration: {
        _id: (registration._id as { toString: () => string }).toString(),
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        courseId: registration.course,
        status: registration.status,
        paid: registration.paid,
        createdAt: registration.createdAt?.toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    return handleError(error, "Failed to create registration");
  }
}