"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
//Internal
const CollectionEngine_1 = require("./Collections/CollectionEngine");
const Database_1 = require("./Database");
const Server_1 = require("./Server");
const Logger_1 = require("./Common/Logger");
class YomiInitialiser {
    static run(dbpath, coljsonpath, env) {
        return __awaiter(this, void 0, void 0, function* () {
            if (env && env == 'prod') {
                yield this.instantiate('/data/manga', '/data/collections.json');
            }
            else {
                Logger_1.Logger.log('INFO', 'Running Yomi Server in Dev Mode.');
                yield this.instantiate(dbpath, coljsonpath);
            }
        });
    }
    static instantiate(dbpath, coljsonpath) {
        return __awaiter(this, void 0, void 0, function* () {
            var mdb = new Database_1.Database(dbpath);
            yield mdb.setup();
            var cdb = new CollectionEngine_1.CollectionEngine(coljsonpath, mdb); //use /data/collections.json for prod
            yield cdb.setup(); //Does nothing atm.
            let server = new Server_1.Server(mdb, cdb); //Make collection data accessible through API, pass param here.
        });
    }
}
/*
    Run modes for Yomi:
        dev:
            Uses local directories as configured in lines 38 and 39 to run the server.
        
        prod:
            Uses docker volume directories. Use this param option when building a docker image.
*/
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        //My local development folders. Change if different.
        let d = 'C:/Users/Nlanson/Desktop/Coding/Yomi/test/data/manga'; //Location of manga
        let c = 'C:/Users/Nlanson/Desktop/Coding/Yomi/test/data/collections.json'; //Location of collections.json
        yield YomiInitialiser.run(d, c, 'prod');
    });
}
main();
