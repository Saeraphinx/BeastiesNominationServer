FROM node:24-alpine AS base
WORKDIR /app



FROM base AS deps
RUN apk add --no-cache python3 make g++ py3-pip
RUN corepack enable
# copy package info& install
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable




FROM deps AS builder
# copy the code & build
COPY tsconfig.json vite.config.ts svelte.config.js ./
COPY ./messages ./messages
COPY ./project.inlang ./project.inlang
COPY ./static ./static
COPY ./src ./src
RUN yarn run build
# Prune devDependencies cleanly for production. 
RUN yarn workspaces focus --production



# final build
FROM base
ENV NODE_ENV=production
COPY package.json .yarnrc.yml ./
COPY .yarn ./.yarn
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "build/index.js"]