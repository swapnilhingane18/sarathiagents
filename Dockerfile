# ADDED FOR HACKATHON
# Use official Node.js 18 lightweight Alpine image
FROM node:18-alpine

# Working directory inside the container
WORKDIR /app

# Copy dependency files first (layer caching — faster rebuilds)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the code
COPY . .

# Expose the port the app listens on
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]
