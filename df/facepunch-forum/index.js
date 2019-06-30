#!/usr/bin/env node

'use strict';

const cheerio = require('cheerio');
const request = require('request');
const async = require('async');

const category = process.argv[2];
// ['general', 'vidz', 'games', 'sh', 'pd', 'hwsw', 'dev', 'ftvm', 'cc', 'gmodgd', 'gmoddev', 'gmodhelp', 'rust', 'rusthelp', 'rustmods', 'prototypes'];

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

const seen = [];

const push = url => {
	if (url[0] === '/') {
		url = 'https://forum.facepunch.com' + url;
	}
	if (seen.indexOf(url) === -1) {
		console.log(url);
		seen.push(url);
	}
};

request(`https://forum.facepunch.com/${category}`, (err, res, body) => {
	if (err) {
		console.error(`https://forum.facepunch.com/${category}`, err)
		return cb(null);
	}
	if (res.statusCode !== 200) {
		console.error(`https://forum.facepunch.com/${category} HTTP ${res.statusCode}`);
		return cb(null);
	}
	const jQuery = cheerio.load(body);
	const x = jQuery('pagnation').first().get()[0].attribs;
	const total = Number(x.total);
	const perpage = Number(x.perpage);
	const pages = Math.floor((total + perpage - 1) / perpage);
	const pagearray = [];
	for (let page = 0; page < pages; page++) {
		pagearray.push(page + 1);
	}
	async.eachLimit(pagearray, 128, (page, cb) => {
		async.retry({
			times: 15,
			interval: function(retryCount) {
				return 50 * Math.pow(2, retryCount);
			}
		}, cb => {
			console.error(`Requesting https://forum.facepunch.com/${category}/p/${page}/ (of ${pages} total pages)`);
			request(`https://forum.facepunch.com/${category}/p/${page}/`, (err, res, body) => {
				if (err) {
					console.error(`https://forum.facepunch.com/${category}/p/${page}/`, err)
					return cb(err, res, body);
				}
				if (res.statusCode != 200) {
					console.error(`https://forum.facepunch.com/${category}/p/${page}/ HTTP ${res.statusCode}`);
					return cb(new Error(`Status code ${res.statusCode} != 200`), res, body);
				}
				return cb(err, res, body);
			});
		}, (err, res, body) => {
			if (err) {
				console.error(`https://forum.facepunch.com/${category}/p/${page}/`, err)
				return cb(null);
			}
			if (res.statusCode !== 200) {
				console.error(`https://forum.facepunch.com/${category}/p/${page}/ HTTP ${res.statusCode}`);
				return cb(null);
			}
			const jQuery = cheerio.load(body);
			push(`/${category}/p/${page}/`);
			jQuery('a.threadname').each((jQindex, jQelement) => {
				const attribs = jQuery(jQelement).get()[0].attribs;
				push(attribs.href);
			});
			jQuery('pagnation').each((jQindex, jQelement) => {
				const attribs = jQuery(jQelement).get()[0].attribs;
				if (attribs.skipcurrent !== '1') {
					if (attribs.url !== `/${category}/p/$/`) {
						console.error(attribs);
					}
					return;
				}
				const baseurl = attribs.url;
				const total = Number(attribs.total);
				const perpage = Number(attribs.perpage);
				const pages = Math.floor((total + perpage - 1) / perpage);
				push(`${baseurl.replace('/$/', '/')}`);
				push(`${baseurl.replace('/$/', '')}`);
				let any = false;
				for (let page = 0; page < pages; page++) {
					any = true;
					push(`${baseurl.replace('$', page + 1)}`);
				}
				if (!any) {
					console.error('Grabbed nothing', attribs);
				}
			});
			return cb(null);
		})
	});
});

