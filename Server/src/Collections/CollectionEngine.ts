/*Collection Engine
    Where the collections database is located and methods to create and remove collections.
*/

import { CollectionMangaData, CommonHandlerResult } from '../Common/CommonInterfaces';
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
        newCol.id = this.idCount.toString();
        this.idCount++;
        //validate collection entries here.

        //also perform duplicate name check OR implement collection ID system.
        //if manga validation fails, dont push new collection to the db and return a failure message.
        
        //once validated, push.
        this.coldb.push(newCol);

        return {
            success: true,
            message: "New Collection Successfully created"
        };
    }

    public get collectionList() {
        return this.coldb
    }


}