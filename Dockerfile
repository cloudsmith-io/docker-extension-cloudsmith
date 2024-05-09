FROM golang:1.21-alpine AS builder
ENV CGO_ENABLED=0
WORKDIR /backend
COPY backend/go.* .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download
COPY backend/. .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -ldflags="-s -w" -o bin/service

FROM --platform=$BUILDPLATFORM node:21.6-alpine3.18 AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci
# install
COPY ui /ui
RUN npm run build

FROM alpine
LABEL org.opencontainers.image.title="Cloudsmith" \
    org.opencontainers.image.description="Manage images in your Cloudsmith repositories." \
    org.opencontainers.image.vendor="Cloudsmith" \
    com.docker.extension.account-info="true" \
    com.docker.desktop.extension.api.version=">= 0.3.4" \
    com.docker.extension.screenshots="[{\"url\":\"https://raw.githubusercontent.com/cloudsmith-io/docker-extension-cloudsmith/main/screenshots/images.png\",\"alt\":\"Images listing\"},{\"url\":\"https://raw.githubusercontent.com/cloudsmith-io/docker-extension-cloudsmith/main/screenshots/images2.png\",\"alt\":\"Alternative images listing\"},{\"url\":\"https://raw.githubusercontent.com/cloudsmith-io/docker-extension-cloudsmith/main/screenshots/info.png\",\"alt\":\"Information page\"}]" \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/cloudsmith-io/docker-extension-cloudsmith/main/cloudsmith.svg" \
    com.docker.extension.publisher-url="https://github.com/cloudsmith-io/docker-extension-cloudsmith" \
    com.docker.extension.additional-urls="[{\"title\":\"Cloudsmith\",\"url\":\"https://cloudsmith.io/\"},{\"title\":\"Support\",\"url\":\"https://github.com/cloudsmith-io/docker-extension-cloudsmith/issues\"},{\"title\":\"Privacy policy\",\"url\":\"https://help.cloudsmith.io/docs/individual-privacy-policy\"}]" \
    com.docker.extension.categories="image-registry" \
    com.docker.extension.changelog="Initial release" \
    com.docker.extension.detailed-description=\
"<p>The Cloudsmith Docker Extension brings the power of Cloudsmith repositories directly to Docker Desktop. \
This extension allows you to list and pull images from your Cloudsmith repositories, public and private.</p> \
<p>Features include:</p> \
<ul> \
    <li>Quick navigation through your Cloudsmith repositories</li> \
    <li>Ability to list images and their metadata</li> \
    <li>Easy pulling of images with a single click</li> \
    <li>Easy copying of image names/tags to pull from the CLI</li> \
</ul> \
<p>Use the Cloudsmith Docker Extension to graphically manage Docker images from your Cloudsmith repos.</p>"


COPY --from=builder /backend/bin/service /
COPY docker-compose.yaml .
COPY metadata.json .
COPY cloudsmith.svg .
COPY --from=client-builder /ui/build ui
CMD /service -socket /run/guest-services/backend.sock
