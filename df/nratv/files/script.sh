#!/bin/bash

if test "${1}" == "item"; then
	read -r item_id
	echo "Job ID: ${item_id}"
	item_file=$(mktemp -u)
	wget -qO "${item_file}" "http://103.230.141.2/nratv/${item_id}" || exit 1
	item_dir=$(mktemp -d)
	cd "${item_dir}" || exit 1
	wpull --input-file "${item_file}" --warc-file "${item_id}" --user-agent 'ArchiveTeam' --no-verbose || exit 1
	playlist_path=$(find -type f -name "*.m3u8" | head -n 1)
	playlist_basedir=$(dirname "${playlist_path}")
	playlist_filename=$(basename "${playlist_path}")
	cd "${playlist_basedir}" || exit 1
	cat "${playlist_filename}" | grep -vE '^(#|$)' | xargs -n1 -P1 -I% pv -- % > "/tmp/${item_id}.ts" || exit 1
	while true; do
		find "${item_dir}" -type f '(' -name "*.warc.gz" -a '!' -name "*-meta.warc.gz" ')' -print0 | xargs -0 -n1 -P1 -I% rsync --progress --stats --numeric-ids --no-owner --no-group % rsync://archivebox-hel1.meo.ws/xxx/warcs/ && break
		sleep "$((${RANDOM}%30))"
	done
	while true; do
		rsync --progress --stats --numeric-ids --no-owner --no-group "/tmp/${item_id}.ts" rsync://archivebox-hel1.meo.ws/xxx/files/ && break
		sleep "$((${RANDOM}%30))"
	done
	rm -rf "${item_dir}"
	rm -f "${item_file}"
	rm -f "/tmp/${item_id}.ts"
	exit 0
fi

amqp-consume -q nratv -u amqp://ateam:***@eftrap-amqp.meo.ws/ateam -p 1 /script.sh item
