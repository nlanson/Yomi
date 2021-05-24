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

  public editForm: FormGroup;

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
        if ( r.status == 'success' ) {
          console.log('edit successful');
          this.openSnackBar('Edit Successful', 'Great!');
        }
        this.dialogRef.close();
      },
      err => {
        r = err.error;
        if ( r.status != 'success' ) {
          this.openSnackBar(r.message, 'WTF');
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
