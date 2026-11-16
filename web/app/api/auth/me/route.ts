import { NextRequest } from "next/server";
import { forwardAuthRequest } from "@/lib/auth/serverAuthProxy";

export async function GET(req: NextRequest) {
  return forwardAuthRequest(req, {
    method: "GET",
    path: "/api/auth/me",
    requireAuth: true,
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  return forwardAuthRequest(req, {
    method: "PUT",
    path: "/api/auth/me",
    body,
    requireAuth: true,
  });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  return forwardAuthRequest(req, {
    method: "DELETE",
    path: "/api/auth/me",
    body,
    requireAuth: true,
  });
}
