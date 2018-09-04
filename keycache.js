/**
 * Created by litengfei on 2017/12/18.
 */
var KeyCache = require('key-cache');

var cache = new KeyCache({
    dir: '../cache/'
});

cache.set('name', 'key-cache');
for(var i = 0;i<10000000;i++){
    cache.set(i.toString(),i.toString());
}