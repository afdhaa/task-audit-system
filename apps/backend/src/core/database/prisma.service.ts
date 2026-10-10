import { PrismaClient } from "@prisma/client";

export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === "test" ? [] : ["error", "warn"],
    });
  }
}

export const prisma = new PrismaService();
