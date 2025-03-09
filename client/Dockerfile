FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy your src/index.css (and anything else the postinstall depends on)
COPY src/index.css src/index.css

# Now npm install (the postinstall => build:tw => tailwindcss -i ./src/index.css ... will succeed)
RUN npm install

# Finally copy the rest
COPY . .

RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build"]
