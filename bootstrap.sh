#!/bin/bash

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