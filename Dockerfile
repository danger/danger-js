FROM node:12-slim

LABEL maintainer="Orta Therox"
LABEL "com.github.actions.name"="Danger JS Action"
LABEL "com.github.actions.description"="Runs JavaScript/TypeScript Dangerfiles"
LABEL "com.github.actions.icon"="zap"
LABEL "com.github.actions.color"="blue"

RUN mkdir -p /usr/src/danger
COPY . /usr/src/danger
RUN cd /usr/src/danger && \
  yarn && \
  yarn run build:fast && \
  chmod +x distribution/commands/danger.js && \
  ln -s $(pwd)/distribution/commands/danger.js /usr/bin/danger

ENTRYPOINT ["danger", "ci"]
