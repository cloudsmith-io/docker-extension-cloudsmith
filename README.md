# Cloudsmith Docker Extension

This extension for Docker Desktop allows you to list and pull images from your Cloudsmith repositories, public and private.

![screenshot](https://github.com/cloudsmith-io/docker-extension-cloudsmith/blob/main/screenshots/images.png)

## Install

To build the extension locally:
```
docker build -t jmillercs/cloudsmith:latest .
docker extension install -f jmillercs/cloudsmith:latest
```
Extension images are required to be multi-archtecture for AMD64 and ARM64. To publish:
```
docker buildx build --push --platform=linux/amd64,linux/arm64 --tag=jmillercs/cloudsmith:0.1.2 .
```

You can also follow the build instructions in the Docker documenation at
https://docs.docker.com/desktop/extensions-sdk/build/minimal-frontend-extension/#build-the-extension-and-install-it

The project is also hosted publicly on DockerHub at [https://hub.docker.com/repository/docker/jmillercs/cloudsmith](https://hub.docker.com/repository/docker/jmillercs/cloudsmith)
So pulling a recent tag will automatically download it, e.g
```
docker extension install jmillercs/cloudsmith:0.1.2
```
