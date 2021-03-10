import { CollectionInterface, CommonHandlerResult } from './interfaces';

export class Collection implements CollectionInterface {
    name: string;
    mangas: Array<string>;
    count: number;
    
    constructor(name: string, mangas: Array<string>) {
        this.name = name;
        this.mangas = mangas;
        this.count = this.mangas.length;
    }

    add(manga: string): void {
        this.mangas.push(manga);
    }

    remove(manga: string): CommonHandlerResult {
        let found = false;
        for ( let i=0; i < this.mangas.length; i++ ) {
            if ( this.mangas[i] == manga ) {
                this.mangas.slice(i, 1);
                found = true;
            }
        }

        if ( found == true ) { 
            return {success: true, message: 'Manga not found'}
        } else {
            return {success: false, message: 'Manga not found'}
        }
    }

    edit(newName: string): void {
        this.name = newName;
    }
}