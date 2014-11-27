# group-reduce
Questions and comments are more than welcome!

## install
Install:
```shell
npm install --save group-reduce
```

Require:
```js
var group = require('group-reduce');
```

## examples

First some utility functions, some might not make too much sense until later on:
```js
// Used to reduce an array of numbers to the sum
function add(a, b) { return a + b; }
// Used to map an array of entries to their counts
function getCount(entry) { return entry.count; }
// Used to sort entries by year
function getYear(entry) { return entry.date.getFullYear(); }
```

We all like a simple example, so here it is:
```js
// Some usage data for users 1 and 2. Note that user 1 has multiple counts
var usage = [
    { id: 1, count: 3 },
    { id: 2, count: 5 },
    { id: 1, count: 2 }
];

// Reduce the objects which have the same id to the id and the sum. The sum is computed by first mapping all entries to the count in the entry, and then summing all those numbers. It could be done with only reduce but this is easier to read. 
var result = group(usage).by('id').reduce(function(id, entries) {
    return {
        id: +id,
        sum: entries.map(getCount).reduce(add)
    };
});

// result now equals the following
result = [
    { id: 1, sum: 5 },
    { id: 2, sum: 5 }
];
```

And for those of you who want a big, commented, in-practice example:
```js
// Compact representation of user usage data sorted first by user and then by date
var compact = [
    { id: 1, usage: [ /* usage object for user 1 */
        { date: '2014-01-01', count: 1 },
        { date: '2014-01-02', count: 2 }
    ] },
    { id: 1, usage: [ /* another usage object for user 1 */
        { date: '2014-01-03', count: 3 }
    ] },
    { id: 2, usage: [ /* usage object for user 2 */
        { date: '2014-01-01', count: 1 },
        { date: '2015-01-01', count: 7 }
    ] }
];

// We expand the user objects into entries for each day in the user object
var entries = compact.reduce(function(list, user) {
    // Concatenate the array of objects generated from user joined with day with the accumulative list
    return list.concat(user.usage.map(function(day) {
        return { id: user.id, date: new Date(day.date), count: day.count };
    }));
}, []); // start reducing with an empty list

// Entries now equals the following
entries = [
    { id: 1, date: new Date('2014-01-01'), count: 1 },
    { id: 1, date: new Date('2014-01-02'), count: 2 },
    { id: 1, date: new Date('2014-01-03'), count: 3 },
    { id: 2, date: new Date('2014-01-01'), count: 1 },
    { id: 2, date: new Date('2015-01-01'), count: 7 }
];

// Now we would like to group the entries by year and then by user id, this is the reverse of what it was initially
var results = group(entries)
    .by(getYear) // group by year, the result of this function is used as a key for a {} map
    .reduce(function(year, entries) { // reduce the entries to date objects
        // create and return date object
        return {
            date: new Date(+year, 0, 1), // first day of year
            users: group(entries) // nested grouping
                .by('id') // same effect as .by(function(entry) { return entry.id; })
                .reduce(function(id, entries) {
                    // create and return user object
                    return {
                        id: +id, // convert to integer, not necessarily best practice
                        sum: entries.map(getCount).reduce(add) // get counts from entries and add all of them
                    };
                })
        };
    });
```


## Usage
You use group-reduce like so:
```js
var result = group(entries).and(moreEntries).by(selector).reduce(reductor)
```

`entries` and `moreEntries` can be anything. Non-arrays are put into an array. The function `.and(moreEntries)` simply internally performs entries.concat(moreEntries). 

The function `.by(selector)` takes the `selector` argument which is usually a string. For computed keys it can be a function. The result of `selector(entry)` is used to fill a map with lists of entries. 

The function `.reduce(reductor)` takes a function `reductor` which is invoked for all keys in the internal map and the entries that belong to that key. So `reductor(key, entries)`. The return value of `.reduce(reductor)` is a list of all the reducted values. 
