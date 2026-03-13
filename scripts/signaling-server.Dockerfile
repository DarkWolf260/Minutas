# Dockerfile for RxDB Signaling Server
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
# Install only necessary dependencies for the server
RUN npm install --only=production

# Copy signaling script
COPY scripts/signaling-server.js ./scripts/

# Set environment variables
ENV PORT=8080
EXPOSE 8080

# Command to run the signaling server
CMD ["node", "scripts/signaling-server.js"]
