# Cloudsmith Docker Extension

## Install
```
docker extension rm jmillercs/cloudsmith
docker build -t jmillercs/cloudsmith:latest .
docker extension install -f jmillercs/cloudsmith:latest
```

You can also follow the build instructions in the Docker documenation at
https://docs.docker.com/desktop/extensions-sdk/build/minimal-frontend-extension/#build-the-extension-and-install-it