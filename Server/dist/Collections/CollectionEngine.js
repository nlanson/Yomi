"use strict";
/*Collection Engine
    Where the collections database is located and methods to create and remove collections.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionEngine = void 0;
const Collection_1 = require("./Collection");
class CollectionEngine {
    constructor(collectionpath, mdb) {
        this.coldb = [];
        this.collectionpath = collectionpath;
        this.mangadb = mdb;
    }
    setup() {
        //input data from a json file containing previously created collection data into coldb.
        //iterate over input file and validate each collection. Check if every manga entry in the collection exists in the mangadb and remove if not.
        //need to figure out how to setup file that will compile the docker image and still be dynamic and accessibile.
    }
    newCollection(name, mangas) {
        let newCol = new Collection_1.Collection(name, mangas);
        //validate collection entries here.
        //once validated, push.
        this.coldb.push(newCol);
        return true;
    }
    get collectionList() {
        return this.coldb;
    }
}
exports.CollectionEngine = CollectionEngine;
