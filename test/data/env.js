"use strict";
exports.__esModule = true;
exports.USER_ENV = void 0;

var USER_ENV = /** @class */ (function () {
    function USER_ENV(dburl) {
        this.DATABASE_URL = undefined;
        this.DATABASE_URL = dburl;
    }
    return USER_ENV;
}());
exports.USER_ENV = {
    DATABASE_URL: 'http://localhost:6969'
}