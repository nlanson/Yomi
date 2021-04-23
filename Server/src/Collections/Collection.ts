//Internal
import { CollectionInterface, CollectionMangaData, CommonHandlerResult } from '../Common/CommonInterfaces';

export class Collection implements CollectionInterface {
    public name: string;
    public id: string;
    /**
     * Stores mangas for the collection.\
     * Is an Array.
     */
    public mangas: Array<CollectionMangaData>;
    public count: number;
    
    constructor(name: string, mangas: Array<CollectionMangaData>, id: string) {
        this.name = name;
        this.id = id;
        this.mangas = mangas;
        this.count = this.mangas.length;
    }

    addEntry(manga: CollectionMangaData): void {
        this.mangas.push(manga);
    }

    //This should be using CollectionMangaData as param.
    removeEntry(manga: string): CommonHandlerResult {
        let found = false;
        for ( let i=0; i < this.mangas.length; i++ ) {
            if ( this.mangas[i].title == manga ) {
                this.mangas.slice(i, 1);
                found = true;
            }
        }

        if ( found == true ) { 
            return {status: 'success', message: 'Manga not found'}
        } else {
            return {status: 'failure', message: 'Manga not found'}
        }
    }

    editCollectionName(newName: string): void {
        this.name = newName;
    }

    /**
     * This method finds every instance of a manga in the collection and returns an array of indexes where the said manga is located.
     * @param manga 
     * @returns CommonHandlerResult
     * @data Contained in `return.data` if `return.status` is successful.
     */ 
    findEntries(manga: CollectionMangaData):CommonHandlerResult {
        let r: CommonHandlerResult = {
            status: 'error',
            data: [],
            message: 'default message'
        };
        
        for ( let i=0; i<this.mangas.length; i++ ) {
            if (this.mangas[i].title == manga.title) {
                r.status = 'success'
                r.data.push({
                    index: i
                });
                r.message = `Found ${i} entries of requested manga.`
            }
        }

        if (r.data.length == 0){
            r.status = 'failure';
            r.message = 'No matches found';
        }
        return r;
    }

    /**
     * This method replaces the manga at the given index with the newly passed manga.
     * @param index 
     * @param edit 
     */
    editEntry(index: number, edit: CollectionMangaData) {
        this.mangas[index] = edit;
    }
}