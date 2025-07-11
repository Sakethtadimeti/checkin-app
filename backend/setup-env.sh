#!/bin/bash

# Check if .env file already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Skipping..."
    exit 0
fi

# Copy env.example to .env
if [ -f "env.example" ]; then
    cp env.example .env
    echo "✅ Created .env file from env.example"
    echo "📝 Please review and modify .env file as needed"
else
    echo "❌ env.example file not found"
    exit 1
fi 