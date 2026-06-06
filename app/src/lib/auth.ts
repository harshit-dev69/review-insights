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
  const authResult = await getWorkspace();
  if (authResult) return authResult;

  
  const workspace = await prisma.workspace.findFirst({
    include: { user: true },
  });

  if (workspace) {
    return { user: workspace.user, workspace };
  }

  
  const user = await prisma.user.create({
    data: { clerkId: "dev-user", email: "dev@local", name: "Dev User" },
  });

  const newWorkspace = await prisma.workspace.create({
    data: { userId: user.id, name: "My Business", industry: "General" },
  });

  return { user, workspace: newWorkspace };
}
