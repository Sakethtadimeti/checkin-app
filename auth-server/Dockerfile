# 1. Use official Node image with Alpine for smaller size
FROM node:20-alpine

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy the entire project structure first (including common package)
COPY auth-server auth-server
COPY common common

WORKDIR /app/common
RUN npm install
RUN npm run build

WORKDIR /app/auth-server

RUN npm install

# 5. Build the TypeScript project
RUN npm run build

# 6. Set the command to run the app
CMD ["node", "dist/index.js"]