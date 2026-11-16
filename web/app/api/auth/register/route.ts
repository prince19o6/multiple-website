import { NextRequest } from "next/server";
import { forwardAuthRequest } from "@/lib/auth/serverAuthProxy";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return forwardAuthRequest(req, {
    method: "POST",
    path: "/api/auth/register",
    body,
  });
}

