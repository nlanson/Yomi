//Internal
import { CollectionInterface, CollectionMangaData, CommonHandlerResult } from '../Common/CommonInterfaces';

export class Collection implements CollectionInterface {
    public name: string;
    public id: string;
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
}