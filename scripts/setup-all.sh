#!/bin/bash

# 🚀 Complete Setup Script for Checkin App
# This script performs a complete reset and setup of the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -f "bootstrap.ts" ]; then
        print_error "This script must be run from the scripts directory"
        print_error "Current directory: $(pwd)"
        print_error "Expected files: package.json, bootstrap.ts"
        exit 1
    fi
}

# Function to check if LocalStack is running
check_localstack() {
    print_status "Checking LocalStack connection..."
    
    if ! curl -s http://localhost:4566 >/dev/null 2>&1; then
        print_error "LocalStack is not running on http://localhost:4566"
        print_error "Please start LocalStack first: docker-compose up localstack"
        exit 1
    fi
    
    print_success "LocalStack is running"
}

# Function to drop all tables
drop_tables() {
    print_status "Dropping all DynamoDB tables..."
    
    if npm run bootstrap drop >/dev/null 2>&1; then
        print_success "All tables dropped successfully"
    else
        print_warning "Some tables may not have existed or failed to drop"
    fi
}

# Function to create all tables
create_tables() {
    print_status "Creating all DynamoDB tables..."
    
    if npm run bootstrap setup; then
        print_success "All tables created successfully"
    else
        print_error "Failed to create tables"
        exit 1
    fi
}

# Function to remove all users
remove_users() {
    print_status "Removing all existing users..."
    
    if npm run remove-user -- --all >/dev/null 2>&1; then
        print_success "All users removed successfully"
    else
        print_warning "No users to remove or removal failed"
    fi
}

# Function to create seed users
create_seed_users() {
    print_status "Creating seed users..."
    
    if npm run create-seed-users; then
        print_success "Seed users created successfully"
    else
        print_error "Failed to create seed users"
        exit 1
    fi
}

# Function to list all users
list_users() {
    print_status "Listing all users..."
    echo ""
    
    if npm run list-users; then
        print_success "User listing completed"
    else
        print_error "Failed to list users"
        exit 1
    fi
}

# Function to show summary
show_summary() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "📋 What was done:"
    echo "  ✅ Dropped all existing tables"
    echo "  ✅ Created fresh DynamoDB tables"
    echo "  ✅ Removed all existing users"
    echo "  ✅ Created 12 seed users (2 managers + 10 members)"
    echo "  ✅ Listed all users for verification"
    echo ""
    echo "📖 User credentials: See scripts/user-setup.md"
}

# Function to ensure npm install is run
ensure_npm_install() {
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/ts-node" ]; then
        print_status "node_modules or ts-node not found. Running npm install..."
        if npm install; then
            print_success "npm install completed successfully"
        else
            print_error "npm install failed"
            exit 1
        fi
    else
        print_success "Dependencies already installed"
    fi
}

# Main execution
main() {
    echo "🚀 Checkin App - Complete Setup Script"
    echo "======================================"
    echo ""
    
    # Check prerequisites
    check_directory
    ensure_npm_install
    check_localstack
    
    # Check if npm is available
    if ! command_exists npm; then
        print_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    # Check if ts-node is available (local or global)
    if ! command_exists ts-node && [ ! -f "./node_modules/.bin/ts-node" ]; then
        print_error "ts-node is not installed. Run: npm install"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
    echo ""
    
    # Execute setup steps
    drop_tables
    echo ""
    
    create_tables
    echo ""
    
    remove_users
    echo ""
    
    create_seed_users
    echo ""
    
    list_users
    echo ""
    
    show_summary
}

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@" 