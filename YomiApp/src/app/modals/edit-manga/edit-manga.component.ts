import { Component, OnInit, Inject } from '@angular/core';
import {  FormGroup, FormBuilder, Validators } from '@angular/forms';

import { DatabaseService } from '../../database/database.service';

import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';


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

    let res = await this.db.editManga(editObj);

    if ( res.found == true && res.message == 'Success' ) {
      console.log('edit successful');
      this.openSnackBar('Edit Successful', 'Great!');
    } else if ( res.found == true && res.message != 'Success' ) {
      console.log('edit request was valid but rename failed.');
      this.openSnackBar('Edit Failed. Have another shot at it.', 'Ok!');
    } else {
      console.log('edit was invalid');
      this.openSnackBar('Edit Failed Miserably', 'RIP');
    }

    this.dialogRef.close();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

}
