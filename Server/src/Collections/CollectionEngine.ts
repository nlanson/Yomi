/*Collection Engine
    Where the collections database is located and methods to create and remove collections.
*/

import { CollectionMangaData } from '../Common/CommonInterfaces';
import { Database } from '../Database';
import { Collection } from './Collection'
 
export class CollectionEngine {
    private collectionpath: string;
    public coldb: Array<Collection> = [];
    private mangadb: Database;

    constructor(collectionpath: string, mdb: Database) {
        this.collectionpath = collectionpath;
        this.mangadb = mdb;
    }

    public setup() {
        //input data from a json file containing previously created collection data into coldb.
        //iterate over input file and validate each collection. Check if every manga entry in the collection exists in the mangadb and remove if not.

        //need to figure out how to setup file that will compile the docker image and still be dynamic and accessibile.
    }
    
    public newCollection(name: string, mangas: Array<CollectionMangaData>): Boolean {
        let newCol = new Collection(name, mangas);
        //validate collection entries here.

        //also perform duplicate name check OR implement collection ID system.
        
        //once validated, push.
        this.coldb.push(newCol);

        return true;
    }

    public get collectionList() {
        return this.coldb
    }


}