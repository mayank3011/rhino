// app/api/categories/route.ts
import { NextResponse } from "next/server";
import connect from "../../../lib/mongodb";
import Category, { ICategory } from "../../../models/Category";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth";
import process from "process";

interface TokenPayload {
  userId: string;
  role?: string;
}

interface CategoryResponse {
  _id: string;
  name: string;
}

interface CreateCategoryRequest {
  name?: string;
}

interface ErrorResponse {
  error: string;
}

async function ensureAdmin(): Promise<TokenPayload> {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  
  const payload = verifyToken(token) as TokenPayload;
  if (!payload || payload.role !== "admin") throw new Error("forbidden");
  
  return payload;
}

export async function GET(): Promise<NextResponse<CategoryResponse[]>> {
  await connect();
  const categories: ICategory[] = await Category.find().sort({ name: 1 }).lean();
  
  const response: CategoryResponse[] = categories.map(category => ({
    _id: category._id.toString(),
    name: category.name
  }));
  
  return NextResponse.json(response);
}

export async function POST(req: Request): Promise<NextResponse<CategoryResponse | ErrorResponse>> {
  try {
    await ensureAdmin();
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Not authorized" }, 
      { status: 401 }
    );
  }

  const body: CreateCategoryRequest = await req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 422 });
  }

  await connect();
  
  try {
    const created: ICategory = await Category.create({ name });
    return NextResponse.json(
      { 
        _id: created._id.toString(), 
        name: created.name 
      }, 
      { status: 201 }
    );
  } catch (error) {
    const err = error as Error & { code?: number };
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Category exists" }, 
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Create failed" }, 
      { status: 500 }
    );
  }
}