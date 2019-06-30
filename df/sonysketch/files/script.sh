#!/bin/bash

if test "${1}" == "dump"; then
	read -r id
	echo "Job ID: ${id}"
	item_file=$(mktemp -u)
	wget -qO "${item_file}" "http://103.230.141.2/sketch/${id}" || exit 1
	sed -i 's|^|https://storage.sketch.sonymobile.com/feed/|;s|$|/image|' "${item_file}"
	item_dir=$(mktemp -d)
	cd "${item_dir}"
	GRAB_SITE_HOST=103.230.141.2 GRAB_SITE_PORT=29090 grab-site --ua "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36" --id "sketch_${id}" --no-dupespotter --wpull-args="--retry-connrefused --retry-dns-error" -i "${item_file}"
	while true; do
		find "${item_dir}" -type f '(' -name "*.warc.gz" -a '!' -name "*-meta.warc.gz" ')' -print0 | xargs -0 -n1 -P1 -I% rsync --progress --stats --numeric-ids --no-owner --no-group % rsync://archivebox-hel1.meo.ws/sonysketch/ && break
		sleep "$((${RANDOM}%30))"
	done
	rm -rf "${item_dir}"
	rm -f "${item_file}"
	exit 0
fi

amqp-consume -q sonysketch -u amqp://sonysketch:***@eftrap-amqp.meo.ws/sonysketch -p 1 /script.sh dump
