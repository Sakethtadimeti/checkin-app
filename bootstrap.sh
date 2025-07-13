#!/bin/bash

npm run stop

npm run dev
# wait for docker to be ready
# wait until the auth-server is running
while ! docker ps | grep -q "checkin-auth-server"; do
    echo "Waiting for auth-server to be ready..."
    sleep 1
done
echo "Auth server is ready"

# Build the common package
npm run build:common

cd scripts

# run the setup-all.sh script
./setup-all.sh

# Backend lambda deployment
cd ..

cd backend

npm install
npm run build
npm run build:lambda
npm run deploy

echo "Backend is ready; all lambda functions deployed"

cd ..
cd frontend
npm install
npm run dev

