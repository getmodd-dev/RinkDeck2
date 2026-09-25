# --- Build Stage ---
# Use --platform=$BUILDPLATFORM to run the Vite/esbuild compilation natively on the host runner (x86_64)
# avoiding QEMU emulation crashes and memory exhaustion during multi-arch builds.
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app

# Install libc6-compat for native tooling stability on Alpine
RUN apk add --no-cache libc6-compat

# Copy package dependency manifests
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy application source code
COPY . .

# Set Node memory limit for Vite bundling
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build Vite frontend and bundle server.cjs via esbuild
RUN npm run build

# --- Production Stage ---
# Multi-arch target image (amd64 / arm64)
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV CONFIG_DIR=/app/data

# Install minimal production runtime requirements
RUN apk add --no-cache curl tzdata

# Create persistent data volume mountpoint and tracks/sounds directories
RUN mkdir -p /app/data/tracks /app/data/sounds /app/dist

# Copy package metadata
COPY package.json ./

# Copy built frontend assets and bundled backend server from builder
# (server.cjs has all server dependencies bundled, requiring no npm install under QEMU)
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/public /app/public

# Volume for persistent storage (/app/data)
VOLUME ["/app/data"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
