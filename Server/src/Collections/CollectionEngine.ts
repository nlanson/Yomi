/*Collection Engine
    Where the collections database is located and methods to create and remove collections.
*/

import { CollectionMangaData } from '../Common/Interfaces';
import { Database } from '../Database';
import { Collection } from './Collection'
 
export class CollectionEngine {
    collectionpath: string;
    coldb: Array<Collection> = [];
    mangadb: Database;

    constructor(collectionpath: string, mdb: Database) {
        this.collectionpath = collectionpath;
        this.mangadb = mdb;
    }

    setup() {
        //input data from a json file containing previously created collection data into coldb.
        //iterate over input file and validate each collection. Check if every manga entry in the collection exists in the mangadb and remove if not.

        //need to figure out how to setup file that will compile the docker image and still be dynamic and accessibile.
    }
    
    newCollection(name: string, mangas: Array<CollectionMangaData>) {
        let newCol = new Collection(name, mangas);
        this.coldb.push(newCol);
    }


}