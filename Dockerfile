FROM node:14-slim as build

LABEL maintainer="Orta Therox"
LABEL "com.github.actions.name"="Danger JS Action"
LABEL "com.github.actions.description"="Runs JavaScript/TypeScript Dangerfiles"
LABEL "com.github.actions.icon"="zap"
LABEL "com.github.actions.color"="blue"

WORKDIR /usr/src/danger
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn run build:fast
RUN yarn remove 'typescript' --dev && yarn add 'typescript'
RUN yarn install --production --frozen-lockfile
RUN chmod +x distribution/commands/danger.js


FROM node:14-slim
WORKDIR /usr/src/danger
ENV PATH="/usr/src/danger/node_modules/.bin:$PATH"
COPY package.json ./
COPY --from=build /usr/src/danger/distribution ./dist
COPY --from=build /usr/src/danger/node_modules ./node_modules
RUN ln -s /usr/src/danger/dist/commands/danger.js /usr/bin/danger

ENTRYPOINT ["danger", "ci"]
