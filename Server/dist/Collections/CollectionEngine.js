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
        this.idCount = 1;
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
        //Makeshift ID System
        //In future, this should be replaced with some random alphanumerical string with a duplication check.
        newCol.id = this.idCount.toString();
        this.idCount++;
        //validate collection entries here.
        //Match each manga entry in the new collection to mangas in the Database. 
        //if manga validation fails, dont push new collection to the db and return a failure message.
        //TEMP 100% push no fail.
        //Implement validation thingo above ^^^
        this.coldb.push(newCol); //Push new colelction to the Collection DB.
        return {
            success: true,
            message: "New Collection Successfully created"
        };
    }
    get collectionList() {
        return this.coldb;
    }
}
exports.CollectionEngine = CollectionEngine;
