#!/bin/bash

urldecode() {
	local url_encoded="${1//+/ }"
	printf '%b' "${url_encoded//%/\\x}"
}

feed="${1}"
highest="${2}"
lowest="${3}"
#lowest=$((${lower}+500))
counter=0
job_id=0
job_prefix=""

next="api%2Ffeeds%2F${feed}"
test -n "${highest}" && next="${next}%3Fn%3D${highest}%26l%3D150"

path="sketch"
test -n "${highest}" && path="sketch-${highest}-0"
test -n "${highest}" && test -n "${lowest}" && path="sketch-${highest}-${lowest}"

mkdir "$path"

while true; do
	UAX=$(cat /data/sketch/uax.txt | grep -vE '^($|#)' | shuf -n 1)
	data=$(curl -A "${UAX}" -sf "https://sketch.sonymobile.com/api/1/feed/featured/list/default/${next}")
	if test "${?}" != "0"; then
		echo "Retrying (${next})" 1>&2
		sleep 5
		continue
	fi
	list=$(echo "${data}" | jq -r '.result.list[].id')
	echo "${list}"
	job_id=$((${job_id}+1))
	echo "${list}" > "$path/${job_prefix}${job_id}"
	length=$(echo "${list}" | wc -l)
	counter=$((${counter}+${length}))
	echo $(urldecode "${next}")" +${length} = ${counter} -> $path/sketch-${feed}-${job_id}" 1>&2
	next=$(echo "${data}" | jq -r 'if .result and .result.paging and .result.paging.next then .result.paging.next else empty end')
	test -z "${next}" && break
	test -z "${lowest}" && continue
	next_id=$(echo "${next}" | grep -oE '%3Fn%3D[0-9]+%26' | cut -c 8- | cut -d% -f1)
	test "${next_id}" -lt "${lowest}" && break
done

echo done 1>&2
