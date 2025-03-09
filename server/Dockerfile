# /calendar-ai/server/Dockerfile

FROM node:20-bullseye-slim

WORKDIR /app

# 1) Copy only package.json + lock for caching
COPY package.json package-lock.json ./
RUN npm install

# 2) Copy the rest of the code (including src/ and .env.production, if you want it inside the container)
COPY . .

# 3) Build the TS -> JS (this uses .env.production for anything needed at build time)
RUN npm run build

RUN npm prisma generate

# 4) Expose the port that your server will listen on
EXPOSE 6060

# 5) Start the compiled app, also reading .env.production at runtime
CMD ["npm", "start"]
