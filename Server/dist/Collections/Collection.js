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
    removeEntry(manga) {
        let found = false;
        for (let i = 0; i < this.mangas.length; i++) {
            if (this.mangas[i].title == manga) {
                this.mangas.slice(i, 1);
                found = true;
            }
        }
        if (found == true) {
            return { success: true, message: 'Manga not found' };
        }
        else {
            return { success: false, message: 'Manga not found' };
        }
    }
    editCollectionName(newName) {
        this.name = newName;
    }
}
exports.Collection = Collection;
