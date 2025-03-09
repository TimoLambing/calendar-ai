# client/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package manifests first
COPY package.json package-lock.json ./

RUN npm install

# Now copy everything (including ./src/index.css)
COPY . .

# Now do the build steps
RUN npm run build:tw       # Or remove if your main build script already does it
RUN npm run build

RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build"]
