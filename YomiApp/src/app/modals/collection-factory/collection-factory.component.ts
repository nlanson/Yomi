import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';

import { MangaData } from 'src/app/database/MangaInterface';
import { DatabaseService } from '../../database/database.service';

import {MatSnackBar} from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-collection-factory',
  templateUrl: './collection-factory.component.html',
  styleUrls: ['./collection-factory.component.scss']
})
export class CollectionFactoryComponent implements OnInit {

  public mangaList: Array<MangaData>;
  public collectionForm: FormGroup;

  constructor(
    private db: DatabaseService,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CollectionFactoryComponent>
  ) { }

  async ngOnInit(): Promise<void> {
    await this.getList();

    this.collectionForm = this.fb.group({
      name: [null],
      mangas: this.fb.array([]) //Init new form array
    });

    const mangas = this.collectionForm.get("mangas") as FormArray; //Assign var mangas to "mangas"form array in collectionForm.
    this.mangaList.forEach((m) => { //Push each manga into the form array.
      mangas.push(
        this.fb.group({
          title: m.title,
          selected: [null]
        })
      );
    });
  }

  async getList() {
    var res = await this.db.getList();
    if (res.status == 200) {
      this.mangaList = res.body;
    } else {
      console.log(`List Status Code ${res.status}.`);
      this.mangaList = [];
    }
  }

  //Form Functions

  getFormControls() {
    return (this.collectionForm.get('mangas') as FormArray).controls;
  }

  async submit() {
    this.dialogRef.disableClose = true; //Disable component closing whilst sending new collection request.
    let newColData = this.collectionForm.value;

    for (let i=0; i < newColData.mangas.length; i++) {
      //Check if any manga's selected value is null and if it is then set it to false.
      if ( newColData.mangas[i].selected == null ) {
        newColData.mangas[i].selected = false;
      }
    }

    let r = await this.db.newCollection(newColData.name, newColData.mangas);
    //r.body will be CommonHandlerResult so .message will contain string message on success of failure reason and .success will indicate if successful or not.
    this.dialogRef.disableClose = false; //Enable component collapse again as the request is over.


    //Snackbar notifications.
    if (r.body.success)
      this.openSnackBar("New Collection was Created Successfully!", "Awesome");
    else
      this.openSnackBar(r.body.message, "Okay.");

  }

  private openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

}
