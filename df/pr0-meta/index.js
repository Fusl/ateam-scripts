#!/usr/bin/env node

'use strict';

/* jshint esversion: 8, strict: true */

var signals = {
	'SIGHUP': 1,
	'SIGINT': 2,
	'SIGTERM': 15
};

Object.keys(signals).forEach((signal) => {
	process.on(signal, () => {
		process.exit(0);
	});
});

const Redis = require('ioredis');
const request = require('request');
const async = require('async');

const redis = new Redis(6379, 'pr0_redis');

const uniq = arr => {
	return arr.reduce(function(prev, cur) {
		return (prev.indexOf(cur) < 0) ? prev.concat([cur]) : prev;
	}, []);
};
const flatten = arr => arr.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten), []);

const flags = 1;
const indexdelay = 604800;

const next = () => {
	console.log('next()');
	redis.get('last_' + flags, (err, last_id) => {
		if (err) {
			console.log(err);
			return setTimeout(next, 15000);
		}
		if (isNaN(Number(last_id))) {
			last_id = 0;
		}
		request('https://pr0gramm.com/api/items/get?newer=' + last_id + '&flags=' + flags, {
			timeout: 30000,
			forever: true,
			headers: {
					'User-Agent': process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36'
			}
		}, (err, res, body) => {
			if (err || res.statusCode !== 200) {
				console.log(err || res.statusCode);
				return setTimeout(next, 15000);
			}
			try {
					body = JSON.parse(body);
			} catch(err) {
				console.log(err);
				return setTimeout(next, 15000);
			}
			const now = Date.now() / 1000;
			body.items = body.items.filter(item => item.created + indexdelay <= now);
			if (!body.items || !body.items.length) {
				console.log('items list empty');
				return setTimeout(next, 15000);
			}
			let last_created = 0;
			let max_id = last_id;
			async.mapLimit(body.items, 32, (item, cb) => {
				if (item.id > max_id) {
						max_id = item.id;
						last_created = item.created;
				}
				redis.set(item.id, now, 'NX', (err, res) => {
					if (err) return cb(err);
					if (res !== 'OK') return cb();
					return cb(item);
				});
			}, (map_err, items) => {
				async.eachLimit(items, 32, (item, cb) => {
					redis.lpush('items', JSON.stringify(item), (err, res) => {
						if (err) return cb(err);
						return cb();
					});
				}, (each_err) => {
					if (map_err) console.log(map_err);
					if (each_err) console.log(each_err);
					if (map_err || each_err) return setTimeout(next, 15000);
					redis.set('last_' + flags, max_id, () => {
						console.error(last_id + ' -> ' + max_id + ' (+' + (max_id - last_id) + ' / ' + (new Date(last_created * 1000)).toUTCString() + ')');
						return setTimeout(next, 500);
					});
				});
			});
		});
	});
};

next();
