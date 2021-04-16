"use strict";
/*Collection Engine
    Where the collections database is located and methods to create and remove collections.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionEngine = void 0;
const Logger_1 = require("../Common/Logger");
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
        //Makeshift ID System
        //In future, this should be replaced with some random alphanumerical string with a duplication check.
        let id = '';
        do {
            id = Math.random().toString(36).slice(2);
        } while (id.length == 0);
        let newCol = new Collection_1.Collection(name, mangas, id);
        let titlesNotFound = [];
        for (let i = 0; i < mangas.length; i++) {
            let found = false;
            let j = 0;
            while (!found && j < this.mangadb.mangadb.length) {
                if (mangas[i].title == this.mangadb.mangadb[j].title) {
                    found = true;
                }
                j++;
            }
            if (!found) {
                Logger_1.Logger.log(`ERROR`, `${mangas[i].title} does not exist.`);
                titlesNotFound.push(mangas[i]);
            }
        }
        if (titlesNotFound.length == 0) {
            Logger_1.Logger.log(`INFO`, `New collection successfully created.`);
            this.coldb.push(newCol); //Push new colelction to the Collection DB.
            return {
                success: true,
                message: "New Collection Successfully created"
            };
        }
        else {
            Logger_1.Logger.log(`ERROR`, `New collection was not created as invalid manga was detected.`);
            return {
                success: false,
                message: "Invalid manga contained in request.",
                content: JSON.stringify(titlesNotFound)
            };
        }
        /* Validate collection entries here.
            - Match each manga entry in the new collection to mangas in the Database.
            - If manga validation fails, dont push new collection to the db and return a failure message.
        */
    }
    get collectionList() {
        return this.coldb;
    }
    delete(id) {
        let i = 0;
        let found = false;
        while (i < this.coldb.length && found == false) {
            if (this.coldb[i].id == id) {
                found = true;
                this.removeCollectionFromDB(i);
            }
            i++;
        }
        if (found == true) {
            return {
                success: true,
                message: 'Collection has been deleted.'
            };
        }
        else {
            return {
                success: false,
                message: 'Collection does not exist.'
            };
        }
    }
    removeCollectionFromDB(i) {
        this.coldb.splice(i, 1);
    }
}
exports.CollectionEngine = CollectionEngine;
