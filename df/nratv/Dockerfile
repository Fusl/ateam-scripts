FROM ateam/grab-site
RUN apk add --no-cache rabbitmq-c-utils bash rsync pv findutils
COPY files /
ENTRYPOINT ["/script.sh"]
