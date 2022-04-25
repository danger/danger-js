FROM node:14-slim as build

LABEL maintainer="Orta Therox"
LABEL "com.github.actions.name"="Danger JS Action"
LABEL "com.github.actions.description"="Runs JavaScript/TypeScript Dangerfiles"
LABEL "com.github.actions.icon"="zap"
LABEL "com.github.actions.color"="blue"

WORKDIR /usr/src/danger
RUN yarn global add yarn-audit-fix
COPY package.json yarn.lock ./
RUN yarn install && \
    yarn-audit-fix
COPY . .
RUN yarn run build:fast
RUN rm -rf node_modules
RUN yarn install --production --frozen-lockfile

FROM node:14-slim
WORKDIR /usr/src/danger
COPY package.json ./
COPY --from=build /usr/src/danger/distribution ./dist
COPY --from=build /usr/src/danger/node_modules ./node_modules
RUN chmod +x /usr/src/danger/dist/commands/danger.js && \
    ln -s /usr/src/danger/dist/commands/danger.js /usr/bin/danger

ENTRYPOINT ["danger", "ci"]
