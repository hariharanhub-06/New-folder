
# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies needed for better-sqlite3 build (if prebuilds fail)
# Alpine handles this well mostly, but python might be needed sometimes.
# For now, we try simple install.
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies (including production deps)
RUN npm install

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Define volume for persistent data (Database & Images)
VOLUME ["/app/data", "/app/public/uploads"]

# Start command
CMD ["npm", "start"]
