FROM node:10-slim

MAINTAINER Orta Therox

LABEL "com.github.actions.name"="Danger JS"
LABEL "com.github.actions.description"="Runs JavaScript/TypeScript Dangerfiles"
LABEL "com.github.actions.icon"="zap"
LABEL "com.github.actions.color"="blue"

RUN yarn run build
RUN ln -s distribution/commands/danger.js /usr/bin/danger

ENTRYPOINT ["danger", "ci"]
