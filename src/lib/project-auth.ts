import { NextResponse } from "next/server";
import { db } from "./db";

export async function requireProjectMember(userId: string, projectId: string) {
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return member;
}

export async function requireProjectOwner(userId: string, projectId: string) {
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return member;
}
