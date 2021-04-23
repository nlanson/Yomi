"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionEngine = void 0;
/*Collection Engine
    Where the collections database is located and methods to create and remove collections.
*/
const fs_1 = __importDefault(require("fs"));
const Logger_1 = require("../Common/Logger");
const Collection_1 = require("./Collection");
class CollectionEngine {
    constructor(collectionpath, mangadb) {
        this.collectionpath = collectionpath;
        this.mangadb = mangadb;
        //Declarations
        this.coldb = [];
        this.coljson = require(this.collectionpath);
    }
    setup() {
        //Synchronise JSON contents with ColDB.
        //Should perform checks here to make sure each entry in the JSON is valid.
        this.coldb = this.coljson.save_data;
        Logger_1.Logger.log(`DEBUG`, `Collection Engine Ignited`);
    }
    saveData() {
        let sd = {
            save_data: this.coldb
        };
        fs_1.default.writeFileSync(this.collectionpath, JSON.stringify(sd, null, 2));
    }
    newCollection(name, mangas) {
        //ID System
        //Maybe implement duplication check.
        let id = '';
        do {
            id = Math.random().toString(36).slice(2);
        } while (id.length == 0);
        //Create new collection in var newCol.
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
            this.saveData();
            return {
                status: 'success',
                message: "New Collection Successfully created"
            };
        }
        else {
            Logger_1.Logger.log(`ERROR`, `New collection was not created as invalid manga was detected.`);
            return {
                status: "failure",
                message: "Invalid manga contained in request.",
                data: JSON.stringify(titlesNotFound)
            };
        }
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
                status: 'success',
                message: 'Collection has been deleted.'
            };
        }
        else {
            return {
                status: 'failure',
                message: 'Collection does not exist.'
            };
        }
    }
    removeCollectionFromDB(i) {
        this.coldb.splice(i, 1);
        this.saveData();
    }
    /**
     * This method is called when a manga in the DB is edited with a new name.
     * @param originalName
     * @param newName
     */
    updateMangaNameForEachEntry(originalName, newName) {
        //Formatting the new and old names as CollectionMangaData Objects.
        let original = { title: originalName };
        let edit = { title: newName };
        //For each collection in the coldb, find every instance of the manga to be edited and update.
        for (let i = 0; i < this.coldb.length; i++) {
            let f = this.coldb[i].findEntries(original);
            if (f.status == 'success') {
                //For each index returned, update it to the new name,
                for (let j = 0; j < f.data.length; j++) {
                    this.coldb[i].editEntry(f.data[j].index, edit);
                }
            }
            else if (f.status == 'error') {
                Logger_1.Logger.log(`ERROR`, `Error when finding entries in collection and attempting to edit.`);
            }
        }
    }
}
exports.CollectionEngine = CollectionEngine;
