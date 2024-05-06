#FROM golang:1.21-alpine AS builder
FROM python:3.10-alpine AS builder
ENV CGO_ENABLED=0
WORKDIR /app
#COPY backend/go.* .
COPY backend/* .
#COPY backend/requirements.txt .
#RUN --mount=type=cache,target=/go/pkg/mod \
#    --mount=type=cache,target=/root/.cache/go-build \
#    go mod download
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY backend/. .

#RUN --mount=type=cache,target=/go/pkg/mod \
#    --mount=type=cache,target=/root/.cache/go-build \
#    go build -trimpath -ldflags="-s -w" -o bin/service

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
LABEL org.opencontainers.image.title="cloudsmith" \
    org.opencontainers.image.description="Manage docker containers in your cloudsmith repositories." \
    org.opencontainers.image.vendor="Cloudsmith" \
    com.docker.desktop.extension.api.version="0.3.4" \
    com.docker.extension.screenshots="" \
    com.docker.desktop.extension.icon="" \
    com.docker.extension.detailed-description="" \
    com.docker.extension.publisher-url="" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.categories="" \
    com.docker.extension.changelog=""

#COPY --from=builder /backend/bin/service /
COPY docker-compose.yaml .
COPY metadata.json .
COPY cloudsmith.svg .
COPY --from=client-builder /ui/build ui
#CMD /service -socket /run/guest-services/backend.sock
#CMD ["python", "-m", "flask", "run", "--host=0.0.0.0"]
#CMD ["python", "main.py"]

RUN apk update && apk add --no-cache python3 py3-pip uwsgi-python3

# Set the working directory inside the container
WORKDIR /app
COPY backend/* .
# Copy the requirements file to the container
COPY backend/requirements.txt .

# Install Python packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt --break-system-packages

# Copy all other files into the working directory
COPY . .
EXPOSE 80

# Run the main Python script
CMD ["chmod", "777", "/run/guest-services/backend.sock"]
CMD ["uwsgi", "--ini", "uwsgi.ini"]
#CMD ["python3", "main.py"]