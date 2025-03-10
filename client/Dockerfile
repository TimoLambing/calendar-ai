FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm add -g serve

# Copy package files
COPY package.json package-lock.json ./

# Now npm install (the postinstall => build:tw => tailwindcss -i ./src/index.css ... will succeed)
RUN npm install

# Finally copy the rest
COPY . .

# Build the application
RUN npm run build

# Specify the command to run your application using 'serve'
CMD ["serve", "-s", "build"]

# Expose the port your app runs on
EXPOSE 3000
