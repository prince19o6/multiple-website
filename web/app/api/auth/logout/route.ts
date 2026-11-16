import { NextRequest } from "next/server";
import { forwardAuthRequest } from "@/lib/auth/serverAuthProxy";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  return forwardAuthRequest(req, {
    method: "POST",
    path: "/api/auth/logout",
    body,
  });
}
