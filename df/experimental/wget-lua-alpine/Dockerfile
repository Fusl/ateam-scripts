# FROM alpine
FROM python:3-alpine
# RUN apk add lua5.1 git bzip2 bash rsync gcc musl-dev lua5.1-dev zlib-dev openssl-dev autoconf flex make
RUN apk add git bzip2 bash rsync gcc musl-dev zlib-dev gnutls-dev autoconf flex make luajit-dev patch automake gettext-dev
WORKDIR /tmp/wget
RUN wget -O- http://xor.meo.ws/nolsIxBnXCu3PrEnUUwkwqRFhDLaVz2c/wget-1.14.lua.LATEST.tar.bz2 | tar -xj --strip-components=1
COPY patch /patch
RUN patch < /patch/configure-luajit.patch
RUN aclocal
RUN automake
RUN ./configure --with-ssl=gnutls -disable-nls
RUN make -j $(nproc)
RUN src/wget -V | grep -q lua
RUN cp src/wget /usr/local/bin/wget-lua

