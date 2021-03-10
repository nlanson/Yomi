"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = void 0;
class Collection {
    constructor(name, mangas) {
        this.name = name;
        this.mangas = mangas;
        this.count = this.mangas.length;
    }
    add(manga) {
        this.mangas.push(manga);
    }
    remove(manga) {
        let found = false;
        for (let i = 0; i < this.mangas.length; i++) {
            if (this.mangas[i] == manga) {
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
    edit(newName) {
        this.name = newName;
    }
}
exports.Collection = Collection;
