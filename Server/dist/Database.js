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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const fs_1 = __importDefault(require("fs"));
const fsPromises = fs_1.default.promises;
const path_1 = __importDefault(require("path"));
const Logger_1 = require("./Logger");
class Database {
    constructor(dbpath) {
        this.dbpath = dbpath;
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mangadb = yield this.scan_dir();
            yield this.init_db();
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mangadb = yield this.scan_dir();
            yield this.init_db();
            return true;
        });
    }
    //Scans for any directories that could contain manga in the Database Path.
    scan_dir() {
        Logger_1.Logger.log(`DEBUG`, 'Scanning specifed path for manga...');
        return new Promise((resolve) => {
            var mangasList = [];
            fs_1.default.readdir(this.dbpath, (err, files) => {
                if (files == undefined) {
                    resolve(mangasList);
                }
                else {
                    files.forEach((file) => {
                        let fileDir = path_1.default.join(this.dbpath, file);
                        if (fs_1.default.statSync(fileDir).isDirectory()) { //If the file in this.dbpath is a directory, add to the mangas list.
                            mangasList.push({
                                title: file,
                                path: fileDir
                            });
                        }
                        else {
                            Logger_1.Logger.log(`DEBUG`, `Deleting ${file} as it is not a directory.`);
                            fs_1.default.unlink(fileDir, (err) => {
                                if (err)
                                    Logger_1.Logger.log('ERROR', `${err}`);
                            });
                        }
                    });
                    Logger_1.Logger.log(`DEBUG`, 'Scan complete');
                    resolve(mangasList);
                }
            });
        });
    }
    //Initiales the DB from scanned dirs.
    init_db() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.log('DEBUG', 'Creating Database Object');
            for (let i = 0; i < this.mangadb.length; i++) {
                this.mangadb[i].pageCount = yield this.getPageCount(this.mangadb[i].path); //Count how many files are in the path to fugure out how many pages are in the manga.
                if (this.mangadb[i].pageCount == 0) {
                    Logger_1.Logger.log('DEBUG', `Deleting ${this.mangadb[i].title} as it has a page count of zero.`);
                    fs_1.default.rmdirSync(this.mangadb[i].path, { recursive: true });
                    this.mangadb.splice(i, 1); //If there are no pages in the directory, remove it from the db.
                    continue;
                }
                this.mangadb[i].pages = yield this.makePagesArray(this.mangadb[i].path); //Create an array of pages and their directories.
                this.mangadb[i].cover = this.addPreview(this.mangadb[i].pages); //Creates a cover property with the first page of the manga as the value.
            }
            Logger_1.Logger.log('DEBUG', 'Database created.');
        });
    }
    addPreview(pages) {
        return pages[0];
    }
    getPageCount(abs_path) {
        return new Promise((resolve) => {
            var pages = [];
            fs_1.default.readdir(abs_path, (err, files) => {
                files.forEach((file) => {
                    let filetype = path_1.default.extname(abs_path + '/' + file);
                    //console.log(`${file} is a ${filetype}`);
                    if ( //List all accepted page types here.
                    filetype == '.jpg' ||
                        filetype == '.JPG' ||
                        filetype == '.png' ||
                        filetype == '.PNG' ||
                        filetype == '.jpeg' ||
                        filetype == '.JPEG') {
                        pages.push(abs_path + '/' + file);
                    }
                });
                resolve(pages.length);
            });
        });
    }
    makePagesArray(abs_path) {
        return new Promise((resolve) => {
            var pages = [];
            fs_1.default.readdir(abs_path, (err, files) => {
                //Sort pages by time
                files = files.map(function (fileName) {
                    return {
                        name: fileName,
                        time: fs_1.default.statSync(abs_path + '/' + fileName).mtime.getTime()
                    };
                })
                    .sort(function (a, b) {
                    return a.time - b.time;
                })
                    .map(function (v) {
                    return v.name;
                });
                files.forEach((file) => {
                    let filetype = path_1.default.extname(abs_path + '/' + file);
                    if ( //List all accepted page types here.
                    filetype == '.jpg' ||
                        filetype == '.JPG' ||
                        filetype == '.png' ||
                        filetype == '.PNG' ||
                        filetype == '.jpeg' ||
                        filetype == '.JPEG') {
                        pages.push(abs_path + '/' + file);
                    }
                });
                resolve(pages);
            });
        });
    }
} //END DB Class
exports.Database = Database;
