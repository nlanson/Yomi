import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { DatabaseService } from '../../database/database.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-upload-manga',
  templateUrl: './upload-manga.component.html',
  styleUrls: ['./upload-manga.component.scss']
})
export class UploadMangaComponent implements OnInit {

  uploadForm: FormGroup;
  file: File = null;
  progress: number = 0;
  Math = Math;
  message: string;

  constructor(
    private db: DatabaseService,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
        file: [null]
    });
  }

  async submit() {
    this.message = undefined;
    let res = this.db.uploadManga(this.file);
    res.subscribe(
      (event: any) => {
        if ( event.type === HttpEventType.UploadProgress ) {
          this.progress = Math.round(100 * event.loaded / event.total);
        } else if ( event instanceof HttpResponse ) {
          let resp = event.body
          let message = resp.message //This is the HTTP Response sent from the server.
          console.log(message);

          //Handle post upload success here.
          this.progress = 0;
          this.message = 'Upload Complete!'
        }
      },
      err => {
        this.progress = 0;
        console.log(err);
        this.message = 'Failed';
      }
    );
  }

  fileChange(event) {
    console.log('set file');
    this.file = event.target.files[0];
  }


}
