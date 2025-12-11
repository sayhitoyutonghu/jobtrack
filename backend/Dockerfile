FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm install instead of npm ci to avoid lockfile mismatch issues
RUN npm install --omit=dev

# Copy source code
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
