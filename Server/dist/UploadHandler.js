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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadHandler = void 0;
//External
const fs_1 = __importDefault(require("fs"));
const fsPromises = fs_1.default.promises;
const path_1 = __importDefault(require("path"));
const unzipper = require('unzipper');
const Logger_1 = require("./Common/Logger");
class UploadHandler {
    constructor(file, db) {
        this.tempdb = [];
        this.file = file;
        this.db = db;
        this.temp = this.db.dbpath + '/temp/';
        this.filetype = this.getFileType();
    }
    //Method to call.
    handle() {
        return __awaiter(this, void 0, void 0, function* () {
            let response = { success: false, message: 'unhandled.' };
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.unarchive();
                }
                catch (error) {
                    Logger_1.Logger.log('ERROR', `${error.message}`);
                    response.message = error.message;
                    resolve(response);
                }
                try {
                    yield this.scan_temp();
                    if (this.tempdb.length == 0) {
                        response.message = 'No valid files were in the archive.';
                        resolve(response);
                    }
                }
                catch (e) {
                    Logger_1.Logger.log('ERROR', `${e.message}`);
                    response.message = e.message;
                    resolve(response);
                }
                try {
                    yield this.pageValidator();
                    if (this.tempdb.length == 0) {
                        response.message = 'No valid files were in the archive.';
                        resolve(response);
                    }
                }
                catch (e) {
                    Logger_1.Logger.log('ERROR', `${e.message}`);
                    response.message = e.message;
                    resolve(response);
                }
                try {
                    yield this.mv();
                }
                catch (e) {
                    Logger_1.Logger.log('ERROR', `${e.message}`);
                    response.message = 'No valid files were in the archive.';
                    resolve(response);
                }
                try {
                    this.deleteDir(this.temp);
                    this.deleteFile(this.file);
                }
                catch (e) {
                    Logger_1.Logger.log('ERROR', `${e.message}`);
                    response.message = 'No valid files were in the archive.';
                    resolve(response);
                }
                response.success = true;
                response.message = 'Uploaded and Unpacked';
                resolve(response);
            }));
        });
    }
    getFileType() {
        let filetype = path_1.default.extname(this.file);
        return filetype;
    }
    unarchive() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let result = { success: false, message: 'unarchiver failure' };
                switch (this.filetype) {
                    case ('.zip'):
                        result = yield this.unzip();
                        resolve(result);
                        break;
                    default:
                        reject(new Error(`Unsupported file type "${this.filetype}"`));
                }
            }));
        });
    }
    unzip() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const zip = yield fs_1.default.createReadStream(this.file) //Extract ZIP to /temp/ folder.
                    .pipe(unzipper.Extract({ path: this.temp }))
                    .on('close', () => __awaiter(this, void 0, void 0, function* () {
                    let result = { success: true, message: 'Unzipped.' };
                    resolve(result);
                }))
                    .on('error', () => __awaiter(this, void 0, void 0, function* () {
                    reject(new Error('Unzipping read stream gave an error.'));
                }));
            }));
        });
    }
    scan_temp() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var e_1, _a;
                let files = yield fsPromises.readdir(this.temp);
                try {
                    for (var files_1 = __asyncValues(files), files_1_1; files_1_1 = yield files_1.next(), !files_1_1.done;) {
                        let file = files_1_1.value;
                        Logger_1.Logger.log(`INFO`, `File: ${file}`);
                        let fileDir = path_1.default.join(this.temp, file);
                        //If the file in this.dbpath is a directory, do the dupe detection.  
                        if (fs_1.default.statSync(fileDir).isDirectory()) {
                            //Dupe Detection Loop. Checks if there are any dupes in the real db.
                            let inval = false;
                            let dupe_UI = 1;
                            do {
                                let check = yield this.checkForInvalidFileName(file);
                                if (!check) {
                                    //If the directory is not a duplicate, add it to the tempdb.
                                    inval = false;
                                    this.tempdb.push({
                                        title: file,
                                        path: fileDir
                                    });
                                }
                                else {
                                    //If the directory is a dupe, tag it with the dupe_UI and reloop.
                                    inval = true;
                                    Logger_1.Logger.log(`DEBUG`, `${file} is an invalid name.`);
                                    file = file + `(${dupe_UI.toString()})`;
                                    dupe_UI++;
                                }
                            } while (inval == true);
                        }
                        else {
                            // If the file is not a directory purge it,
                            fs_1.default.unlink(fileDir, (err) => {
                                if (err)
                                    reject(new Error(`fs.unlink() gave an error while deleting ${file}`));
                            });
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (files_1_1 && !files_1_1.done && (_a = files_1.return)) yield _a.call(files_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                resolve({ success: true, message: 'Temp scanned' });
            }));
        });
    }
    checkForInvalidFileName(title) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let i = 0;
                let found = false;
                while (i < this.db.mangadb.length && found == false) {
                    if ((this.db.mangadb[i].title == title) || (title == 'temp')) {
                        found = true;
                    }
                    i++;
                }
                resolve(found);
            });
        });
    }
    pageValidator() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                for (let i = 0; i < this.tempdb.length; i++) {
                    try {
                        if (fs_1.default.statSync(this.tempdb[i].path).isDirectory()) {
                            this.tempdb[i].pageCount = yield this.getPageCount(this.tempdb[i].path);
                        }
                    }
                    catch (e) {
                        Logger_1.Logger.log('ERROR', `${e.message}`);
                        reject(new Error(e.message));
                    }
                    if (this.tempdb[i].pageCount == 0) {
                        Logger_1.Logger.log(`DEBUG`, `${this.tempdb[i].path} has no valid pages.`);
                        if (fs_1.default.statSync(this.tempdb[i].path).isDirectory()) {
                            fs_1.default.rmdirSync(this.tempdb[i].path, { recursive: true });
                        }
                        this.tempdb.splice(i, 1);
                        continue;
                    }
                }
                let response = { success: true, message: 'Pages Validated' };
                resolve(response);
            }));
        });
    }
    getPageCount(manga_path) {
        return new Promise((resolve, reject) => {
            var pages = 0;
            fs_1.default.readdir(manga_path, (err, files) => {
                if (err)
                    reject(new Error('fs.readdir() threw an error whilst counting pages.'));
                files.forEach((file) => {
                    let filetype = path_1.default.extname(this.temp + '/' + file);
                    if (filetype == '.jpg' ||
                        filetype == '.JPG' ||
                        filetype == '.png' ||
                        filetype == '.PNG' ||
                        filetype == '.jpeg' ||
                        filetype == '.JPEG') {
                        pages++;
                    }
                });
                resolve(pages);
            });
        });
    }
    mv() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                for (let i = 0; i < this.tempdb.length; i++) {
                    fs_1.default.rename(this.tempdb[i].path, this.db.dbpath + '/' + this.tempdb[i].title, (err) => {
                        if (err)
                            reject(new Error(`Failed migrating ${this.tempdb[i].path} to live database.`));
                    });
                }
                let response = { success: true, message: 'Move successful.' };
                resolve(response);
            });
        });
    }
    deleteDir(dir) {
        fs_1.default.rmdir(dir, (err) => {
            if (err)
                throw new Error(`Directory ${dir} could not be deleted: ${err}`);
        });
    }
    deleteFile(file) {
        fs_1.default.unlink(file, (err) => {
            if (err)
                throw new Error(`File ${file} could not be deleted: ${err}`);
        });
    }
}
exports.UploadHandler = UploadHandler;
