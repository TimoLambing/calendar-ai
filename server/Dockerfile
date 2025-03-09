# server/Dockerfile
FROM node:20-bullseye-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# Copy everything else
COPY . .

# (Optional) If you want to compile from TS -> JS:
# e.g. "build": "tsc" in package.json
RUN npm run build

EXPOSE 6060

# Then run the compiled code
CMD ["node", "dist/index.js"]
