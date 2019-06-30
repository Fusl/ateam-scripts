FROM python:3
RUN DEBIAN_FRONTEND=noninteractive DEBIAN_PRIORITY=critical apt-get -qqy --no-install-recommends -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-unsafe-io update \
 && DEBIAN_FRONTEND=noninteractive DEBIAN_PRIORITY=critical apt-get -qqy --no-install-recommends -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-unsafe-io install git bzip2 bash rsync gcc musl-dev zlib1g-dev gnutls-dev autoconf flex make libluajit-5.1-dev patch automake gettext
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

