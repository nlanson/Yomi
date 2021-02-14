"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app = express_1.default();
const port = 6969;
class Database {
    constructor(dbpath) {
        this.dbpath = dbpath;
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mangadb = yield this.scan_dir();
            this.init_db();
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mangadb = yield this.scan_dir();
            this.init_db();
        });
    }
    //Scans for any directories that could contain manga in the Database Path.
    scan_dir() {
        console.log('Scanning...');
        return new Promise((resolve) => {
            var mangasList = [];
            fs_1.default.readdir(this.dbpath, (err, files) => {
                files.forEach((file) => {
                    let fileDir = path_1.default.join(this.dbpath, file);
                    if (fs_1.default.statSync(fileDir).isDirectory()) { //If the file in this.dbpath is a directory, add to the mangas list.
                        mangasList.push({
                            title: file,
                            path: path_1.default.relative(this.dbpath, fileDir)
                        });
                    }
                });
                console.log('DONE');
                resolve(mangasList);
            });
        });
    }
    //Initiales the DB from scanned dirs.
    init_db() {
        console.log('Creating DB');
        for (let i = 0; i < this.mangadb.length; i++) {
            this.mangadb[i].pageCount = this.getPageCount(this.mangadb[i].path); //Count how many files are in the path to fugure out how many pages are in the manga.
            if (this.mangadb[i].pageCount == 0) {
                this.mangadb.splice(i, 1); //If there are no pages in the directory, remove it from the db.
                continue;
            }
            this.mangadb[i].pages = this.makePagesArray(this.mangadb[i].path); //Create an array of pages and their directories.
        }
        console.log('DONE');
    }
    getPageCount(rel_path) {
        let abs_path = path_1.default.join(this.dbpath, rel_path);
        return fs_1.default.readdirSync(abs_path).length;
    }
    makePagesArray(rel_path) {
        let abs_path = path_1.default.join(this.dbpath, rel_path);
        var pages = [];
        fs_1.default.readdir(abs_path, (err, files) => {
            files.forEach((file) => {
                //TODO: Only push jpg, png or jpeg file types as often manga downloaded contains ads in pdf or html format.
                pages.push(rel_path + '/' + file);
            });
        });
        return pages;
    }
} //END DB Class
class Server {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        //List all the api requests here.
        this.refreshdb();
        this.searchByTitle();
        this.listdb();
        this.listen();
    }
    listen() {
        this.app.listen(port, () => {
            console.log(`Yomi Server listening at http://localhost:${port}`);
        });
    }
    searchByTitle() {
        //Returns the Manga info such as title, path and page count as well as array of page paths.
        this.app.get('/manga/:title', (req, res) => {
            let search = req.params.title;
            console.log(`Searched requested for ${search}`);
            let found = false;
            let i = 0;
            while (i < this.db.mangadb.length && found == false) {
                if (this.db.mangadb[i].title == req.params.title) {
                    found = true;
                    res.json(this.db.mangadb[i]);
                }
                i++;
            }
            if (found == false)
                res.json({ status: 'Not Found' });
        });
    }
    listdb() {
        // Can be used to list all manga in the DB to click and open.
        this.app.get('/list', (req, res) => {
            console.log('List requested.');
            let list = [];
            for (let manga in this.db.mangadb) {
                const listEntry = ((_a) => {
                    var { pages } = _a, manga = __rest(_a, ["pages"]);
                    return manga;
                })(this.db.mangadb[manga]); // Remove pages property from mangadb entries and push into list.
                list.push(listEntry);
            }
            res.json(list);
        });
    }
    refreshdb() {
        this.app.get('/refresh', (req, res) => {
            console.log('Refresh requested.');
            this.db.refresh();
            res.json({ status: 'Refreshed.' });
        });
    }
} //END Server Class
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var dbpath = 'C:/Users/Nlanson/Desktop/Coding/Yomi/manga'; //Will be docker manga volume.
        var db = new Database(dbpath);
        yield db.setup();
        let server = new Server(app, db);
    });
}
main();
