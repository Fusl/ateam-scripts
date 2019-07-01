FROM python:3.5-slim-stretch
RUN DEBIAN_FRONTEND=noninteractive DEBIAN_PRIORITY=critical apt-get -qqy --no-install-recommends -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-unsafe-io update
RUN DEBIAN_FRONTEND=noninteractive DEBIAN_PRIORITY=critical apt-get -qqy --no-install-recommends -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-unsafe-io install \
    rsync wget xz-utils build-essential python3-dev python3-pip libxml2-dev libxslt-dev zlib1g-dev libssl-dev libsqlite3-dev libffi-dev git tmux fontconfig-config fonts-dejavu-core libfontconfig1 libjpeg62-turbo libjpeg62 lsof autossh
RUN mkdir -p /usr/local/bin
RUN wget -O- https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz | tar vxJ --strip-components=1 -C /usr/local/bin --wildcards "ffmpeg-git-*-amd64-static/ffmpeg" "ffmpeg-git-*-amd64-static/ffprobe"
RUN wget -O- https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 | tar vxj --strip-components=2 -C /usr/local/bin phantomjs-2.1.1-linux-x86_64/bin/phantomjs
RUN wget -O/usr/local/bin/youtube-dl https://yt-dl.org/downloads/latest/youtube-dl
RUN chmod a+rx /usr/local/bin/youtube-dl /usr/local/bin/ffmpeg /usr/local/bin/ffprobe /usr/local/bin/phantomjs
RUN git clone https://github.com/ArchiveTeam/ArchiveBot /opt/ArchiveBot
WORKDIR /opt/ArchiveBot
RUN git submodule update --init
RUN pip3 install --user -r pipeline/requirements.txt
RUN ln -s /root/.local/bin/wpull /opt/ArchiveBot/pipeline/wpull
ENV REDIS_URL=redis://redisssh:6379/0 \
    FINISHED_WARCS_DIR=/data \
    RSYNC_URL=rsync://fos.textfiles.com/archivebot/ \
    NO_SCREEN=1 \
    PYTHONUNBUFFERED=1
WORKDIR /opt/ArchiveBot/pipeline
CMD ["/opt/ArchiveBot/uploader/uploader.py", "/data/warcs4fos"]
