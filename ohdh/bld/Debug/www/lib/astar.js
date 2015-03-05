

(function (definition) {
    /* global module, define */
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = definition();
    } else if (typeof define === 'function' && define.amd) {
        define([], definition);
    } else {
        var exports = definition();
        window.astar = exports.astar;
        window.Graph = exports.Graph;
    }
})(function () {

    

    

    

    

    

    return {
        astar: astar,
        Graph: Graph
    };

});