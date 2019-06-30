FROM alpine
# RUN apk add lua5.1 git bzip2 bash rsync gcc musl-dev lua5.1-dev zlib-dev openssl-dev autoconf flex make
RUN apk add git bzip2 bash rsync gcc musl-dev zlib-dev openssl-dev autoconf flex make lua5.1-dev patch automake gettext-dev gperf xz texinfo wget coreutils
RUN git clone https://github.com/Fusl/wget-lua.git /tmp/wget
WORKDIR /tmp/wget
RUN ./bootstrap
RUN ./configure --with-ssl=openssl -disable-nls
RUN make -j $(nproc)
RUN src/wget -V | grep -q lua
RUN cp src/wget /usr/local/bin/wget-lua

