#!/bin/bash

# NATS RBAC UI Development Startup Script

echo "🚀 Starting NATS RBAC Management UI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

# Navigate to UI directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment configuration..."
    cp .env.example .env
    echo "✏️  Please edit .env file to configure your API endpoint if needed."
fi

# Check if backend is running
echo "🔍 Checking backend API availability..."
API_URL=${VITE_API_BASE_URL:-"http://localhost:8080"}
if curl -s -f "${API_URL}/api/v1/health" > /dev/null 2>&1; then
    echo "✅ Backend API is running at ${API_URL}"
else
    echo "⚠️  Backend API is not available at ${API_URL}"
    echo "   Please make sure the NATS RBAC API server is running."
    echo "   You can still start the UI, but some features may not work."
fi

# Start development server
echo "🌟 Starting development server..."
if command -v yarn &> /dev/null; then
    yarn dev
else
    npm run dev
fi