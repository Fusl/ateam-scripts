FROM python:3-alpine
RUN apk add --no-cache git \
 && pip3 install git+https://github.com/JustAnotherArchivist/qwarc.git
WORKDIR /data
ENTRYPOINT ["qwarc"]
