# calendar-ai/server/Dockerfile
# Dockerfile for the backend (Express + Prisma)

FROM node:20-bullseye-slim

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies using npm
RUN npm install

# Copy the remaining application files
COPY . .

# Generate Prisma client (if needed)
RUN npx prisma generate

# Expose the port that your server actually listens on
# In your server/index.ts, you have httpServer.listen(6060),
# so the container will run on 6060 internally:
EXPOSE 6060

# Start the server using npm
CMD ["npm", "start"]
