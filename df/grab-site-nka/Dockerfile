FROM ateam/grab-site
COPY patch /patch
RUN cd /usr/local/lib/python3.7/site-packages/wpull/protocol/http/ && patch < /patch

