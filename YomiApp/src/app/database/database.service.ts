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

  getList(): Observable<HttpResponse<any>> {
    let url = this.baseurl + '/list';
    return this.http.get(url, {observe: 'response'});
  }

  getManga(title): Observable<HttpResponse<CommonAPIResult>> {
    let url = this.baseurl + `/manga/${title}`;
    return this.http.get<CommonAPIResult>(url, {observe: 'response'});
  }

  refreshdb(): Observable<HttpResponse<CommonAPIResult>> {
    let url = this.baseurl + '/refresh'
    return this.http.get<CommonAPIResult>(url, {observe: 'response'});
  }

  editManga(editObj): Observable<HttpResponse<CommonAPIResult>> {
    let editString = JSON.stringify(editObj);
    let url = this.baseurl + '/editManga/' + editString;
    return this.http.get<CommonAPIResult>(url, {observe: 'response'});
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

  delete(title: string): Observable<HttpResponse<CommonAPIResult>> {
    let delobj = {title: title};
    let delString = JSON.stringify(delobj);
    let url = this.baseurl + '/deleteManga/' + delString;
    return this.http.get<CommonAPIResult>(url, {observe: 'response'});
  }

  /*
    Collection Functions
      Functions here use the hot new Observable system.
  */

  public newCollection(name:string, mangasList: Array<MangaData>): Observable<HttpResponse<CommonAPIResult>> {
    let requestObj = {
      name: name,
      mangas: mangasList
    }

    let url = this.baseurl + "/collections/new/" + JSON.stringify(requestObj);
    let res: Observable<HttpResponse<CommonAPIResult>> = this.http.get<CommonAPIResult>(url, {observe: 'response'})

    return res;
  }

  getCollections(): Observable<HttpResponse<any>> {
    let url = this.baseurl + '/collections/list/';

    return this.http.get(url, {observe: 'response'})
  }

  public deleteCollection(id: string): Observable<HttpResponse<CommonAPIResult>> {
    //Delete a collection by ID.
    let url = this.baseurl + `/collections/delete/${id}`
    let res: Observable<HttpResponse<CommonAPIResult>> = this.http.get<CommonAPIResult>(url, {observe: 'response'});
    return res;

  }


}
