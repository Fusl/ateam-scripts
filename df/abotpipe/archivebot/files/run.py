#!/usr/bin/env python3

import platform
import subprocess
import sys
import os
import time
import signal
import psutil

PIPE_NAME = os.environ.get('PIPE_NAME')
PIPE_NAME_PREFIX = os.environ.get('PIPE_NAME_PREFIX')
MAX_ITEMS = os.environ.get('MAX_ITEMS') or '10'
DISK_LOW_PERC=0.02
DISK_HIGH_PERC=0.05
DISK_LOW_BYTE=67108864
DISK_HIGH_BYTE=536870912

if not PIPE_NAME:
	if not PIPE_NAME_PREFIX:
		raise Exception('No pipeline name (PIPE_NAME env var) or name prefix (PIPE_NAME_PREFIX env var) specified')
	PIPE_NAME = '{}-{}'.format(PIPE_NAME_PREFIX, platform.node())

if len(PIPE_NAME) < 3 or len(PIPE_NAME) > 30:
	raise Exception('Length of pipeline name must be 3-30 characters, was {}'.format(PIPE_NAME))

if not os.path.isdir('/data'):
	os.mkdir('/data')

exit = False
uploader_proc = None
pipeline_proc = None
paused = False

def interrupt_handler(signum, frame):
	print('interrupt_handler()')
	global exit, uploader_proc, pipeline_proc
	exit = True
	with open('STOP', 'a'):
		os.utime('STOP')

signal.signal(signal.SIGINT, interrupt_handler)
signal.signal(signal.SIGTERM, interrupt_handler)

def start_uploader():
	global uploader_proc
	if not uploader_proc or uploader_proc.poll() is not None:
		print('Starting uploader')
		uploader_proc = subprocess.Popen(('/opt/ArchiveBot/uploader/uploader.py', '/data'), stdout=sys.stdout, stderr=sys.stderr)

def start_pipeline():
	global pipeline_proc, PIPE_NAME
	if not pipeline_proc or pipeline_proc.poll() is not None:
		print('Starting pipeline {}'.format(PIPE_NAME))
		pipeline_proc = subprocess.Popen(('/root/.local/bin/run-pipeline3', 'pipeline.py', '--disable-web-server', '--concurrent', '1', '--max-items', MAX_ITEMS, PIPE_NAME), stdout=sys.stdout, stderr=sys.stderr)

def getfreespace(path='/data'):
	statvfs = os.statvfs(path)
	return 1.0 * statvfs.f_bavail / statvfs.f_blocks, statvfs.f_bavail * statvfs.f_bsize;

def pausesignal(sig):
	global pipeline_proc
	if not pipeline_proc or pipeline_proc.poll() is not None:
		return False
	try:
		parent = psutil.Process(pipeline_proc.pid)
	except psutil.NoSuchProcess:
		return False
	parent.send_signal(sig)
	for process in parent.children(recursive=True):
		process.send_signal(sig)

def checkdisk():
	global paused
	pfree, free = getfreespace()
	if not paused and (pfree <= DISK_LOW_PERC or free <= DISK_LOW_BYTE):
		if pausesignal(signal.SIGSTOP):
			paused = True
	elif paused and pfree >= DISK_HIGH_PERC and free >= DISK_HIGH_BYTE:
		if pausesignal(signal.SIGCONT):
			paused = False
	return pfree >= DISK_HIGH_PERC and free >= DISK_HIGH_BYTE

while True:
	start_uploader()
	while not checkdisk() and not exit:
		print('Low on disk space, refusing to start a new pipeline')
		time.sleep(15)
	if exit:
		break
	start_pipeline()

	print('Waiting for pipeline to exit')

	while True:
		try:
			pipeline_proc.wait(timeout=5)
			break
		except subprocess.TimeoutExpired:
			checkdisk()
			start_uploader()
			if exit:
				print('pipeline still running')
				with open('STOP', 'a'):
					os.utime('STOP')

	pipeline_proc = None
	print('pipeline exited')

	if exit or os.path.exists('STOP'):
		if os.path.exists('STOP'):
			os.remove('STOP')
		start_uploader()
		break

print('Waiting for uploader to delete temporary files')
while True:
	for root, dirs, files in os.walk('/data'):
		for filename in files:
			time.sleep(1)
			continue
	break

print('Sending TERM to uploader')
uploader_proc.terminate()

print('Waiting for uploader to exit')
try:
	uploader_proc.wait(timeout=30)
except subprocess.TimeoutExpired:
	print('Sending KILL to uploader')
	uploader_proc.kill()

if uploader_proc.poll() is None:
	print('Waiting for uploader to exit')
	uploader_proc.wait()

