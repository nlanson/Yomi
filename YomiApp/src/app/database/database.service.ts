import { Injectable } from '@angular/core';

import { HttpClient, HttpErrorResponse, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { CommonAPIResult, MangaData } from './api.interfaces';


@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  //baseurl:string = 'https://mdb.nlanson.ga' //Connects to the proxy for the database (My production setup)
  baseurl:string = 'http://localhost:6969' //Connects to local machine of the client (Testing on local machine)

  /*
    Need to find a way for users to set there own proxy url to their version of the hosted database.
  */

  constructor(
    private http: HttpClient
  ) { console.log(this.baseurl) }

  async getList(): Promise<HttpResponse<any>> {
    let url = this.baseurl + '/list';
    let list: HttpResponse<any> = await this.http.get(url, {observe: 'response'}).toPromise();
    return list;
  }

  async getManga(title): Promise<HttpResponse<CommonAPIResult>> {
    let url = this.baseurl + `/manga/${title}`;
    let manga: HttpResponse<CommonAPIResult> = await this.http.get<CommonAPIResult>(url, {observe: 'response'}).toPromise();

    return manga;
  }

  async getCoverImage(title): Promise<HttpResponse<CommonAPIResult>> {
    let url = this.baseurl + `/manga/${title}`;
    let res: HttpResponse<CommonAPIResult> = await this.http.get<CommonAPIResult>(url, {observe: 'response'}).toPromise();

    return res;
  }

  async refreshdb(): Promise<Boolean> {
    let url = this.baseurl + '/refresh'
    let status: HttpResponse<CommonAPIResult> = await this.http.get<CommonAPIResult>(url, {observe: 'response'}).toPromise();

    if (status.status == 200)  { return true }
    else { console.log('Refresh Failed'); return false }
  }

  async editManga(editObj): Promise<HttpResponse<CommonAPIResult>> {
    let editString = JSON.stringify(editObj);
    let url = this.baseurl + '/editManga/' + editString;
    let res: HttpResponse<CommonAPIResult> = await this.http.get<CommonAPIResult>(url, {observe: 'response'}).toPromise();

    //Might need error handling.

    return res;
  }

  upload(file: File): Observable<HttpEvent<CommonAPIResult>> {
    let url = this.baseurl + '/upload';
    let fd = new FormData();
    fd.append('file', file, file.name);

    return this.http.post<CommonAPIResult>(url, fd, {
      reportProgress: true,
      observe: 'events'
    });
  }

  async delete(title: string): Promise<HttpResponse<CommonAPIResult>> {
    let delobj = {title: title};
    let delString = JSON.stringify(delobj);
    let url = this.baseurl + '/deleteManga/' + delString;
    let res: HttpResponse<CommonAPIResult> = await this.http.get<CommonAPIResult>(url, {observe: 'response'}).toPromise();

    return res;
  }

  /*
    Collection Functions
  */

    //Implemented fancy observable returning here. Use this as reference and restructure other functions.
    public newCollection(name:string, mangasList: Array<MangaData>): Observable<HttpResponse<CommonAPIResult>> {
    let requestObj = {
      name: name,
      mangas: mangasList
    }

    let url = this.baseurl + "/collections/new/" + JSON.stringify(requestObj);
    let res: Observable<HttpResponse<CommonAPIResult>> = this.http.get<CommonAPIResult>(url, {observe: 'response'})

    return res;
  }

  async getCollections(): Promise<HttpResponse<any>> {
    let url = this.baseurl + '/collections/list/';

    let list: HttpResponse<any> = await this.http.get(url, {observe: 'response'}).toPromise();
    return list;
  }

  async deleteCollection(id: string): Promise<CommonAPIResult> {
    //Delete a collection by ID.
    let url = this.baseurl + `/collections/delete/${id}`
    let res: HttpResponse<CommonAPIResult>;

    try {
      res = await this.http.get<CommonAPIResult>(url, {observe: 'response'}).toPromise();
    } catch (e) {
      if (e.error)
        return e.error;
    }
    return res.body;
  }


}
