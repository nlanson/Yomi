import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { DatabaseService } from '../../database/database.service';
import { CommonAPIResult } from '../../database/api.interfaces';

import { HttpEventType, HttpResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-upload-manga',
  templateUrl: './upload-manga.component.html',
  styleUrls: ['./upload-manga.component.scss']
})
export class UploadMangaComponent implements OnInit {

  uploadForm: FormGroup;
  file: File = null;
  progress: number = 0;
  Math = Math
  message: string;
  uploading: Boolean;

  constructor(
    private db: DatabaseService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UploadMangaComponent>
  ) {
    this.dialogRef.disableClose = false;
  }

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
        file: [null]
    });
  }

  async submit() {
    this.message = undefined;
    this.progress = 0;
    this.dialogRef.disableClose = true; //Disable component closing whilst uploading.
    this.uploading = true;

    let res = this.db.upload(this.file); //USING NEW UPLOAD METHOD
    res.subscribe(
      (event: any) => {
        if ( event.type === HttpEventType.UploadProgress ) {
          this.progress = Math.round(100 * event.loaded / event.total);
        } else if ( event instanceof HttpResponse ) {
          //This is the HTTP Response sent from the server.
          let resp: CommonAPIResult = event.body
          let status = resp.status;
          this.message = resp.message //This is the HTTP Response sent from the server.
          this.uploading = false;

          //Handle post upload success here.
          this.dialogRef.disableClose = false;
        }
      },
      err => {
        this.progress = 0;
        this.uploading = false;
        this.message = err;
        this.dialogRef.disableClose = false;
      }
    );
  }

  fileChange(event) {
    console.log('set file');
    this.file = event.target.files[0];
  }


}
