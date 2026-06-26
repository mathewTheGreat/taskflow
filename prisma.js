"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const serverless_1 = require("@neondatabase/serverless");
const ws_1 = __importDefault(require("ws"));
const prisma_client_1 = require("../generated/prisma-client");
const adapter_neon_1 = require("@prisma/adapter-neon");
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
console.log('[Prisma] neonConfig.webSocketConstructor configured:', typeof serverless_1.neonConfig.webSocketConstructor);
const globalForPrisma = globalThis;
function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    const adapter = new adapter_neon_1.PrismaNeon({ connectionString });
    return new prisma_client_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}
exports.prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
