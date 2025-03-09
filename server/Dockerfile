FROM node:20-bullseye-slim

WORKDIR /app

# Copy package files so Docker can cache the install layers
COPY package.json package-lock.json ./

# Copy just the Prisma schema folder
COPY src/prisma ./src/prisma

# Now do npm install (the postinstall step will succeed
# because schema.prisma is present)
RUN npm install

# Then copy everything else
COPY . .

EXPOSE 6060
CMD ["npm", "start"]
