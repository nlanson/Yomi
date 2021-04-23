"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = void 0;
class Collection {
    constructor(name, mangas, id) {
        this.name = name;
        this.id = id;
        this.mangas = mangas;
        this.count = this.mangas.length;
    }
    addEntry(manga) {
        this.mangas.push(manga);
    }
    //This should be using CollectionMangaData as param.
    removeEntry(manga) {
        let found = false;
        for (let i = 0; i < this.mangas.length; i++) {
            if (this.mangas[i].title == manga) {
                this.mangas.slice(i, 1);
                found = true;
            }
        }
        if (found == true) {
            return { status: 'success', message: 'Manga not found' };
        }
        else {
            return { status: 'failure', message: 'Manga not found' };
        }
    }
    editCollectionName(newName) {
        this.name = newName;
    }
    /**
     * This method finds every instance of a manga in the collection and returns an array of indexes where the said manga is located.
     * @param manga
     * @returns CommonHandlerResult
     * @data Contained in `return.data` if `return.status` is successful.
     */
    findEntries(manga) {
        let r = {
            status: 'error',
            data: [],
            message: 'default message'
        };
        for (let i = 0; i < this.mangas.length; i++) {
            if (this.mangas[i].title == manga.title) {
                r.status = 'success';
                r.data.push({
                    index: i
                });
                r.message = `Found ${i} entries of requested manga.`;
            }
        }
        if (r.data.length == 0) {
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
    editEntry(index, edit) {
        this.mangas[index] = edit;
    }
}
exports.Collection = Collection;
