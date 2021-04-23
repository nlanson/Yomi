/*Collection Engine
    Where the collections database is located and methods to create and remove collections.
*/
import fs from 'fs';


import { CollectionMangaData, CollectionSaveFile, CommonHandlerResult } from '../Common/CommonInterfaces';
import { Logger } from '../Common/Logger';
import { Database } from '../Database';
import { Collection } from './Collection';


export class CollectionEngine {
    //Declarations
    public coldb: Array<Collection> = [];
    public coljson: CollectionSaveFile;

    constructor(
        private collectionpath: string, 
        private mangadb: Database
    ) {
        this.coljson = require(this.collectionpath);
    }

    public setup() {
        //Synchronise JSON contents with ColDB.
        //Should perform checks here to make sure each entry in the JSON is valid.
        this.coldb = this.coljson.save_data;
        
        Logger.log(`DEBUG`, `Collection Engine Ignited`);
    }

    private saveData() {
        let sd: CollectionSaveFile = {
            save_data: this.coldb
        };

        fs.writeFileSync(this.collectionpath, JSON.stringify(sd, null, 2));
    }
    
    public newCollection(name: string, mangas: Array<CollectionMangaData>): CommonHandlerResult {
        //ID System
        //Maybe implement duplication check.
        let id: string = '';
        do {
            id = Math.random().toString(36).slice(2);
        } while (id.length == 0);
        
        
        //Create new collection in var newCol.
        let newCol = new Collection(name, mangas, id);
        
        let titlesNotFound: Array<CollectionMangaData> = [];
        for ( let i=0; i<mangas.length; i++ ) {
            let found: boolean = false;
            let j: number = 0;
            while ( !found && j < this.mangadb.mangadb.length ) {
                if ( mangas[i].title == this.mangadb.mangadb[j].title ) {
                    found = true
                }
                j++;
            }

            if ( !found ) {
                Logger.log(`ERROR`, `${mangas[i].title} does not exist.`);
                titlesNotFound.push(mangas[i]);
            }
        }

        if ( titlesNotFound.length == 0 ) {
            Logger.log(`INFO`, `New collection successfully created.`);
            this.coldb.push(newCol); //Push new colelction to the Collection DB.
            this.saveData();
            return { //Return success.
                status: 'success',
                message: "New Collection Successfully created"
            };
        } else {
            Logger.log(`ERROR`, `New collection was not created as invalid manga was detected.`);
            return { //Return failure.
                status: "failure",
                message: "Invalid manga contained in request.",
                data: JSON.stringify(titlesNotFound)
            };
        }
    }

    public get collectionList() {
        return this.coldb
    }

    public delete(id: string): CommonHandlerResult {
        let i: number = 0;
        let found: boolean = false;
        while ( i<this.coldb.length && found == false ) {
            if ( this.coldb[i].id == id ) {
                found = true;
                this.removeCollectionFromDB(i);
            }
            i++
        }
        
        if ( found == true ) {
            return {
                status: 'success',
                message: 'Collection has been deleted.'
            }
        } else {
            return {
                status: 'failure',
                message: 'Collection does not exist.'
            }
        }
    }

    private removeCollectionFromDB(i: number) {
        this.coldb.splice(i, 1);
        this.saveData();
    }

    /**
     * This method is called when a manga in the DB is edited with a new name.
     * @param originalName 
     * @param newName 
     */
    updateMangaNameForEachEntry(originalName:string, newName: string) {
        //Formatting the new and old names as CollectionMangaData Objects.
        let original: CollectionMangaData = { title: originalName };
        let edit: CollectionMangaData = { title: newName };

        //For each collection in the coldb, find every instance of the manga to be edited and update.
        for (let i=0; i<this.coldb.length; i++) {
            let f:CommonHandlerResult = this.coldb[i].findEntries(original);

            if (f.status == 'success') {
                //For each index returned, update it to the new name,
                for (let j = 0; j<f.data.length; j++) {
                    this.coldb[i].editEntry(f.data[j].index, edit);
                }
            } else if (f.status == 'error') {
                Logger.log(`ERROR`, `Error when finding entries in collection and attempting to edit.`);
            }
        }
    }

}