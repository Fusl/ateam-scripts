FROM alpine:3.8
RUN apk add --no-cache ca-certificates ffmpeg python \
 && wget -O /usr/local/bin/youtube-dl https://yt-dl.org/downloads/latest/youtube-dl \
 && chmod +x /usr/local/bin/youtube-dl \
 && youtube-dl --version
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
WORKDIR /data
ENTRYPOINT ["youtube-dl"]
CMD ["--help"]
