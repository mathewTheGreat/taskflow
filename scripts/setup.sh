#!/bin/bash
set -e

echo "=== TaskFlow V1 Setup ==="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "Error: Node.js 20+ required. Found: $(node -v)"
    exit 1
fi

echo "Node.js version: $(node -v)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Neon database connection string!"
    echo "   Get your connection string from: https://console.neon.tech"
    echo ""
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Neon DATABASE_URL"
echo "  2. Run: npx prisma migrate dev --name init"
echo "  3. Run: npm run electron:dev"
echo ""
echo "For web-only development (no Electron):"
echo "  Terminal 1: npm run server"
echo "  Terminal 2: npm run dev"
