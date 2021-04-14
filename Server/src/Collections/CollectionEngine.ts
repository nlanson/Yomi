/*Collection Engine
    Where the collections database is located and methods to create and remove collections.
*/

import { CollectionMangaData, CommonHandlerResult } from '../Common/CommonInterfaces';
import { Logger } from '../Common/Logger';
import { Database } from '../Database';
import { Collection } from './Collection'
 
export class CollectionEngine {
    private collectionpath: string;
    public coldb: Array<Collection> = [];
    private mangadb: Database;
    private idCount: number = 1;

    constructor(collectionpath: string, mdb: Database) {
        this.collectionpath = collectionpath;
        this.mangadb = mdb;
    }

    public setup() {
        //input data from a json file containing previously created collection data into coldb.
        //iterate over input file and validate each collection. Check if every manga entry in the collection exists in the mangadb and remove if not.

        //need to figure out how to setup file that will compile the docker image and still be dynamic and accessibile.
    }
    
    public newCollection(name: string, mangas: Array<CollectionMangaData>): CommonHandlerResult {
        let newCol = new Collection(name, mangas);
        
        //Makeshift ID System
        //In future, this should be replaced with some random alphanumerical string with a duplication check.
        newCol.id = this.idCount.toString();
        this.idCount++;
        
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
            return { //Return success.
                success: true,
                message: "New Collection Successfully created"
            };
        } else {
            Logger.log(`ERROR`, `New collection was not created as invalid manga was detected.`);
            return { //Return failure.
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

    public get collectionList() {
        return this.coldb
    }


}