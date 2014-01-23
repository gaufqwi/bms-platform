// generic function proxy shim
var proxy = function(f, a) {
    postMessage({func: f, args: Array.prototype.slice.call(a, 0)});
};

var print = function() { proxy("print", arguments); };

var onmessage = function(msg) {
    eval(msg.data);         // FIXME: Probably needs to be more robust
};
    