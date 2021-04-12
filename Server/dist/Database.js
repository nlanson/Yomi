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
exports.Database = void 0;
//External
const fs_1 = __importDefault(require("fs"));
const fsPromises = fs_1.default.promises;
const path_1 = __importDefault(require("path"));
//Internal
const Logger_1 = require("./Common/Logger");
const UploadHandler_1 = require("./UploadHandler");
class Database {
    constructor(dbpath) {
        this.dbpath = dbpath;
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mangadb = yield this.scan_dir(true); //Verbose ON
            yield this.init_db(true);
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mangadb = yield this.scan_dir(); //Verbose OFF
            yield this.init_db(false);
            return true;
        });
    }
    //Scans for any directories that could contain manga in the Database Path.
    scan_dir(verbose) {
        if (verbose)
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
                            if (verbose)
                                Logger_1.Logger.log(`DEBUG`, `Deleting ${file} as it is not a directory.`);
                            fs_1.default.unlink(fileDir, (err) => {
                                if (err)
                                    Logger_1.Logger.log('ERROR', `${err}`);
                            });
                        }
                    });
                    if (verbose)
                        Logger_1.Logger.log(`DEBUG`, 'Scan complete');
                    resolve(mangasList);
                }
            });
        });
    }
    //Initiales the DB from scanned dirs.
    init_db(verbose) {
        return __awaiter(this, void 0, void 0, function* () {
            if (verbose)
                Logger_1.Logger.log('DEBUG', 'Creating Database Object');
            for (let i = 0; i < this.mangadb.length; i++) {
                this.mangadb[i].pageCount = yield this.getPageCount(this.mangadb[i].path); //Count how many files are in the path to fugure out how many pages are in the manga.
                if (this.mangadb[i].pageCount == 0) {
                    if (verbose)
                        Logger_1.Logger.log('DEBUG', `Deleting ${this.mangadb[i].title} as it has a page count of zero.`);
                    fs_1.default.rmdirSync(this.mangadb[i].path, { recursive: true });
                    this.mangadb.splice(i, 1); //If there are no pages in the directory, remove it from the db.
                    continue;
                }
                this.mangadb[i].pages = yield this.makePagesArray(this.mangadb[i].path); //Create an array of pages and their directories.
                this.mangadb[i].cover = this.addPreview(this.mangadb[i].pages); //Creates a cover property with the first page of the manga as the value.
            }
            if (verbose)
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
    /*
    API FUNCTIONS
    */
    searchByTitle(title) {
        console.log('query received');
        let found = false;
        let i = 0;
        while (i < this.mangadb.length && found == false) {
            if (this.mangadb[i].title == title) {
                found = true;
                return {
                    success: true,
                    message: "Found",
                    content: this.mangadb[i]
                };
            }
            i++;
        }
        if (found == false) {
            return {
                success: false,
                message: "Manga not found.",
                content: null
            };
        }
        else { //fallback
            return {
                success: false,
                message: "Error",
                content: null
            };
        }
    }
    list() {
        let list = [];
        for (let manga in this.mangadb) {
            const listEntry = ((_a) => {
                var { pages } = _a, manga = __rest(_a, ["pages"]);
                return manga;
            })(this.mangadb[manga]); // Remove pages property from mangadb entries and push into list.
            list.push(listEntry);
        }
        return { success: true, message: 'list compiled', content: list };
    }
    upload(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let filename = file.name;
            let dbresponse;
            try {
                yield file.mv(this.dbpath + '/' + filename);
            }
            catch (e) {
                Logger_1.Logger.log(`ERROR`, 'Failed receiving the file upload.');
                dbresponse = {
                    success: false,
                    message: "Failed at receiving file upload",
                    content: null
                };
                return dbresponse;
            }
            Logger_1.Logger.log('DEBUG', 'Upload received, handling...');
            let archive = this.dbpath + '/' + filename;
            let uh = new UploadHandler_1.UploadHandler(archive, this);
            let result = yield uh.handle();
            switch (result.success) {
                case (true):
                    dbresponse = {
                        success: true,
                        message: 'Upload successful',
                        content: null
                    };
                    this.refresh();
                    return dbresponse;
                case (false):
                    dbresponse = {
                        success: false,
                        message: 'Upload unsuccessful',
                        content: null
                    };
                    return dbresponse;
                default:
                    Logger_1.Logger.log('ERROR', 'Handler failed to instantiate.');
                    dbresponse = {
                        success: false,
                        message: "Handler failed to instantiate",
                        content: null
                    };
                    return dbresponse;
            }
        });
    }
    editMangaName(o, n) {
        return __awaiter(this, void 0, void 0, function* () {
            let i = 0; //Loop iterator
            let found = false; //Was the manga found?
            let message; //return message for the API
            let flag = true; //Flag for checking if FS failed or not.
            while (i < this.mangadb.length && found == false) { //Loop through every manga
                if (this.mangadb[i].title == o) { //If ogname equals any manga in the db then..,
                    found = true;
                    this.mangadb[i].title = n; //Set manga title to the new name
                    //rename directory in db
                    try {
                        yield fsPromises.rename(this.mangadb[i].path, this.dbpath + '/' + n);
                    }
                    catch (e) {
                        flag = false;
                        Logger_1.Logger.log(`ERROR`, 'Edit Failed');
                        message = "Rename failed. Manga exists but FS failed.";
                        return { success: false, message: message, content: null }; //Rename failed. Manga exists but FS failed.
                    }
                    //If rename is successful, code will enter this condition.
                    if (flag) {
                        Logger_1.Logger.log(`DEBUG`, `Successfully Edited ${o} -> ${n}`);
                        message = 'Edit Success';
                        this.refresh(); //Refresh DB
                        return { success: true, message: message, content: null }; // Full success
                    }
                }
                i++;
            }
            //Fallback statement for when manga is not found in the database.
            Logger_1.Logger.log(`ERROR`, 'Edit request manga not found.');
            message = 'Manga not found';
            let response = {
                success: false,
                message: 'Manga not found',
                content: null
            };
            return response;
        });
    }
    deleteManga(title) {
        return __awaiter(this, void 0, void 0, function* () {
            let found = false;
            let i = 0;
            while (i < this.mangadb.length && found == false) {
                if (this.mangadb[i].title = title) {
                    found = false;
                    //Delete directory containing manga
                    yield fsPromises.rmdir(this.dbpath + '/' + title, { recursive: true });
                    //Remove entry from DB
                    this.mangadb.splice(i, 1); //Remove deleted entry from DB
                    Logger_1.Logger.log('DEBUG', `${title} was deleted`);
                    let response = {
                        success: true,
                        message: `Successfully Deleted`,
                        content: null
                    };
                    return response;
                }
            }
            Logger_1.Logger.log('ERROR', 'Manga to delete not found');
            let response = {
                success: false,
                message: `Manga not found`,
                content: null
            };
            return response;
        });
    }
} //END DB Class
exports.Database = Database;
