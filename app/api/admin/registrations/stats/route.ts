// app/api/admin/stats/registrations/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { verifyToken } from "@/lib/auth";
import type { PipelineStage } from "mongoose"; // ✅ important

export const dynamic = "force-dynamic";

type JwtPayload = { role: string };
type AggRow = { _id: string; count: number }; // "_id" will be "YYYY-MM-DD"
type SeriesPoint = { date: string; count: number };

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : (() => { try { return JSON.stringify(err); } catch { return String(err); } })();
}
function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }
function ymdLocal(d: Date): string { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload: JwtPayload;
    try { payload = verifyToken(token) as JwtPayload; } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
    if (payload.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connect();

    const { searchParams } = new URL(req.url);
    const rawDays = Number(searchParams.get("days") ?? "30");
    const days = Math.max(1, Math.min(90, Number.isFinite(rawDays) ? rawDays : 30));

    // Local midnight start of window
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // ✅ Properly typed pipeline
    const pipeline: PipelineStage[] = [
      { $match: { createdAt: { $gte: since } } },
      {
        $project: {
          day: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz },
          },
        },
      },
      { $group: { _id: "$day", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];

    const agg = await Registration.aggregate<AggRow>(pipeline);

    // Dense series
    const map = new Map<string, number>(agg.map(r => [r._id, r.count]));
    const series: SeriesPoint[] = [];
    const cursor = new Date(since);

    for (let i = 0; i < days; i += 1) {
      const key = ymdLocal(cursor);
      const isoLocalMidnight = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate(),
        0, 0, 0, 0
      ).toISOString();

      series.push({ date: isoLocalMidnight, count: map.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const total = series.reduce((sum, p) => sum + p.count, 0);
    return NextResponse.json({ days, total, series });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
