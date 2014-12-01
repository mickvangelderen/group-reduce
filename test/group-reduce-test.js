var expect = require('chai').expect;

var group = require('../lib/group-reduce');

describe('lib/group-reduce.js', function() {

	var add, getCount, getYear,
		simple1a, simple1b, simple2a, simple,
		complex1a, complex1b, complex2a, complex;

	beforeEach(function() {
		add = function(a, b) { return a + b; }
		getCount = function(entry) { return entry.count; }
		getYear = function(entry) { return entry.date.getUTCFullYear(); }

		simple1a = { id: 1, count: 1 };
		simple1b = { id: 1, count: 2 };
		simple2a = { id: 2, count: 3 };

		simple = [ simple1a, simple1b, simple2a ];

		complex1a = {
			id: 1,
			usage: [ { date: '2014-01-01', count: 1 }, { date: '2014-01-02', count: 2 }, { date: '2014-01-03', count: 3 } ]
		};
		complex1b = {
			id: 1,
			usage: [ { date: '2016-02-01', count: 5 } ]
		};
		complex2a = {
			id: 2,
			usage: [ { date: '2014-01-01', count: 1 }, { date: '2015-01-01', count: 7 } ]
		};

		complex = [ complex1a, complex1b, complex2a ];
	});

	it('should work if a nothing is passed to group', function() {
		var result = group([])
			.by('id')
			.reduce(function(key, entries) {
				return {
					id: +key,
					sum: entries.map(getCount).reduce(add)
				};
			});
		expect(result).to.deep.equal([]);
	});

	it('should work if an array is passed to group', function() {
		var result = group(simple)
			.by('id')
			.reduce(function(key, entries) {
				return {
					id: +key,
					sum: entries.map(getCount).reduce(add)
				};
			});
		expect(result).to.deep.equal([ { id: 1, sum: 3 }, { id: 2, sum: 3 } ]);
	});

	it('should work if a non-array is passed to group', function() {
		var result = group(simple1a)
			.by('id')
			.reduce(function(key, entries) {
				return {
					id: +key,
					sum: entries.map(getCount).reduce(add)
				};
			});
		expect(result).to.deep.equal([ { id: 1, sum: 1 } ]);
	});

	it('should work if we group by a function', function() {
		var result = group(simple)
			.by(function(entry) { return entry.id })
			.reduce(function(key, entries) {
				return {
					id: +key,
					sum: entries.map(getCount).reduce(add)
				};
			});
		expect(result).to.deep.equal([ { id: 1, sum: 3 }, { id: 2, sum: 3 } ]);
	});

	it('should work if an array is passed to and', function() {
		var result = group(simple1a)
			.and([ simple1b, simple2a ])
			.by('id')
			.reduce(function(key, entries) {
				return {
					id: +key,
					sum: entries.map(getCount).reduce(add)
				};
			});
		expect(result).to.deep.equal([ { id: 1, sum: 3 }, { id: 2, sum: 3 } ]);
	});

	it('should work if a non-array is passed to and', function() {
		var result = group([ simple1a, simple1b ])
			.and(simple2a)
			.by('id')
			.reduce(function(key, entries) {
				return {
					id: +key,
					sum: entries.map(getCount).reduce(add)
				};
			});
		expect(result).to.deep.equal([ { id: 1, sum: 3 }, { id: 2, sum: 3 } ]);
	});

	it('should work if multiple ands are used', function() {
		var result = group(simple1a)
			.and(simple1b)
			.and(simple2a)
			.by('id')
			.reduce(function(key, entries) {
				return {
					id: +key,
					sum: entries.map(getCount).reduce(add)
				};
			});
		expect(result).to.deep.equal([ { id: 1, sum: 3 }, { id: 2, sum: 3 } ]);
	});

	it('should return a map', function() {
		var map = group(simple).by('id').map(function(key, entries) {
			return entries.map(getCount).reduce(add);
		});
		expect(map).to.have.property('1').that.equals(3);
		expect(map).to.have.property('2').that.equals(3);
	});

	it('should do everything in one test', function() {
		var entries = complex.reduce(function(list, user) {
			return list.concat(user.usage.map(function(day) {
				return { id: user.id, date: new Date(day.date), count: day.count };
			}));
		}, []);

		var result = group(entries)
			.by(getYear)
			.reduce(function(key, entries) {
				return {
					year: +key,
					users: group(entries).by('id')
						.reduce(function(key, entries) {
							return {
								id: +key,
								sum: entries.map(getCount).reduce(add)
							};
						})
				};
			});

		expect(result).to.deep.equal([
			{ year: 2014, users: [ { "id": 1, "sum": 6 }, { "id": 2, "sum": 1 } ] },
			{ year: 2015, users: [ { "id": 2, "sum": 7 } ] },
			{ year: 2016, users: [ { "id": 1, "sum": 5 } ] }
		]);
	});

});