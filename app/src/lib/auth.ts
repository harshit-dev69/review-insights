import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getWorkspace() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    let dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: `${userId}@user.local`,
          name: "User",
        },
      });
    }

    let workspace = await prisma.workspace.findFirst({ where: { userId: dbUser.id } });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          userId: dbUser.id,
          name: "My Business",
          industry: "General",
        },
      });
    }

    return { user: dbUser, workspace };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}
export async function getAnyWorkspace() {
  return await getWorkspace();
}
