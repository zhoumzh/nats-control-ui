#!/bin/bash

# Simple startup script for NATS RBAC UI
echo "🚀 NATS RBAC UI Startup"
echo "======================================="

# Navigate to UI directory
cd "$(dirname "$0")"

echo "📍 Working directory: $(pwd)"

# Check Node.js
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "📝 Please edit .env file to configure API endpoint"
fi

# Start development server
echo "🌟 Starting development server..."
echo "   UI will be available at: http://localhost:3000"
echo "   Make sure your API is running at: http://localhost:8080"
echo ""

npm run dev