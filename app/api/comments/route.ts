import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await request.json().catch(() => null);

  return NextResponse.json(
    {
      error: "留言功能暂未开放。"
    },
    { status: 403 }
  );
}
