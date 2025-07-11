# 1. Use official Node image with Alpine for smaller size
FROM node:20-alpine

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy package files and install deps
COPY package*.json ./
RUN npm install

# 4. Copy the rest of your code
COPY . .

# 5. Build the TypeScript project
RUN npm run build

# 6. Set the command to run the app (change `dist/index.js` as needed)
CMD ["node", "dist/index.js"]