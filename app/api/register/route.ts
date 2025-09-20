// app/api/register/route.ts
import { NextResponse } from "next/server";
import connect from "../../../lib/mongodb";
import Registration from "../../../models/Registration";

export async function POST(req: Request) {
  await connect();
  const body = await req.json();
  const reg = await Registration.create(body);
  return NextResponse.json({ ok: true, id: reg._id }, { status: 201 });
}
