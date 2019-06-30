FROM python:3-alpine
RUN apk add --no-cache git gcc libxml2-dev musl-dev libxslt-dev g++ re2-dev libffi-dev libressl-dev \
 && ln -s /usr/include/libxml2/libxml /usr/include/libxml \
 && pip3 install git+https://github.com/ludios/grab-site.git \
 && sed -i 's|max_connections: int=6|max_connections: int=100|g;s|max_host_count: int=6|max_host_count: int=100|g' /usr/local/lib/python3.7/site-packages/wpull/network/pool.py
WORKDIR /data
ENTRYPOINT ["grab-site"]
