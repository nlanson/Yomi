import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { DatabaseService } from '../../database/database.service';

import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import { CommonAPIResult } from 'src/app/database/api.interfaces';


@Component({
  selector: 'app-edit-manga',
  templateUrl: './edit-manga.component.html',
  styleUrls: ['./edit-manga.component.scss']
})
export class EditMangaComponent implements OnInit {

  editForm: FormGroup;

  constructor
    (
      public dialogRef: MatDialogRef<EditMangaComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private fb: FormBuilder,
      private db: DatabaseService,
      private _snackBar: MatSnackBar
    )
    { }

  ngOnInit(): void {
    this.editForm = this.fb.group( { edit: [null] } );
  }

  async submit() {
    console.log(this.editForm.value.edit);

    let editObj = {
      title: this.data.title,
      edit: this.editForm.value.edit
    };

    let r: CommonAPIResult;
    this.db.editManga(editObj).subscribe(
      data => {
        r = data.body;
        if ( r.success ) {
          console.log('edit successful');
          this.openSnackBar('Edit Successful', 'Great!');
        }
        this.dialogRef.close();
      },
      err => {
        r = err.error;
        if ( err.status > 400 && err.status < 500 ) {
          console.log(`edit was invalid`);
          this.openSnackBar('Edit Failed Miserably (Invalid)', 'RIP');
        } else if  ( err.status > 500 ) {
          console.log('edit request was valid but rename failed.');
          this.openSnackBar('Edit Failed. Have another shot at it.', 'Ok!');
        } else {
          console.log(`EDIT ERROR: {UNKNOWN}`);
          this.openSnackBar('Edit Failed for Unknown Reasons', 'WTF');
        }
        this.dialogRef.close();
      }
    );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 4000,
    });
  }

}
