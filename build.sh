docker extension rm jmillercs/cloudsmith
docker build -t jmillercs/cloudsmith:latest .
docker extension install -f jmillercs/cloudsmith:latest
docker extension dev debug jmillercs/cloudsmith
