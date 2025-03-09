# Dockerfile for frontend

# Use an official Node.js image as a parent image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Manually set PNPM_HOME and update PATH
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Install serve globally
RUN pnpm add -g serve

# Copy application files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application files
COPY . .

# Build the application
RUN pnpm run build

# Specify the command to run your application using 'serve'
CMD ["serve", "-s", "build"]

# Expose the port your app runs on
EXPOSE 3000
