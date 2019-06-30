#!/bin/bash

set -e

docker image build --no-cache .
image=$(docker image build -q .)
container=$(docker container create "${image}")
docker cp "${container}:/usr/local/bin/wget-lua" "./wget-lua"
docker rm "${container}"

