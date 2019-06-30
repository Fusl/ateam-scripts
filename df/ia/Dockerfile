FROM python:3-alpine
RUN pip3 install internetarchive \
 && ln -fs /data/.ia /root/.ia
ENV PYTHONUNBUFFERED=1
WORKDIR /data
ENTRYPOINT ["ia"]
