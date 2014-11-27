var util = require('util');

module.exports = group

function group(list) {
	if (!util.isArray(list)) { list = [ list ]; }
	var map = Object.create(null);
	var self = {
		and: function(entries) {
			if (util.isArray(entries)) {
				list = list.concat(entries);
			} else {
				list.push(entries);
			}
			return self;
		},
		by: function(selector) {
			if (typeof selector !== 'function') {
				var property = selector;
				selector = function(entry) { return entry[property]; }
			}
			list.forEach(function(entry) {
				var key = selector(entry);
				if (key in map) {
					map[key].push(entry);
				} else {
					map[key] = [ entry ];
				}
			});
			return self;
		},
		reduce: function(reductor) {
			return Object.keys(map).map(function(key) {
				return reductor(key, map[key]);
			});
		}
	}
	return self;
}