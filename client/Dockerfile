# calendar-ai/client/Dockerfile
# Dockerfile for the frontend (React + Vite)

FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy only package.json and package-lock.json first (for build caching)
COPY package.json package-lock.json ./

# Install dependencies using npm (instead of pnpm)
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

# Install 'serve' (so we can serve the production build)
RUN npm install -g serve

# Expose the port your React app will run on inside the container
EXPOSE 3000

# Use 'serve' to serve the production build by default
CMD ["serve", "-s", "build"]
