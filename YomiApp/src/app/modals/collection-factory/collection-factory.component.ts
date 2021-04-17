import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { MangaData } from 'src/app/database/api.interfaces';
import { DatabaseService } from '../../database/database.service';

import {MatSnackBar} from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-collection-factory',
  templateUrl: './collection-factory.component.html',
  styleUrls: ['./collection-factory.component.scss']
})
export class CollectionFactoryComponent implements OnInit {

  private dataLoaded: Promise<boolean>;
  public mangaList: Array<MangaData>;
  public collectionForm: FormGroup;
  public FormError: any = {
    nullName: false,
    nullManga: false,
  };

  constructor(
    private db: DatabaseService,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CollectionFactoryComponent>
  ) { }

  async ngOnInit(): Promise<void> {
    this.getList(() =>{
      this.loadForm();
    });
  }

  getList(cb?:() => any) {
    this.db.getList().subscribe(
      data => {
        console.log(data.body);
        this.mangaList = data.body;
        this.dataLoaded = Promise.resolve(true);
        if (cb)
          cb();
      },
      err => {
        if ( err.error )
          console.log(`Error loading list: ${err.error}`);

        if (cb)
          cb();
      }
    );
  }

  loadForm() {
    this.collectionForm = this.fb.group({
      name: [null, Validators.required],
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

  //Return form array.
  getFormControls() {
    return (this.collectionForm.get('mangas') as FormArray).controls;
  }

  //On new collection submission.
  async submit() {
    //Reset form error values.
    this.FormError = {
      nullName: false,
      nullManga: false
    }

    //Disable component closing whilst sending new collection request.
    this.dialogRef.disableClose = true;
    //Assign form value to variable.
    let newColData = this.collectionForm.value;

    //Check if collection name field is empty.
    if ( newColData.name == null || newColData.name == '' ) {
      this.FormError.nullName = true;
      return;
    }

    //Thanks to https://stackoverflow.com/questions/49021164/splice-not-removing-element-from-array
    let i=0;
    while (i<newColData.mangas.length) {
      if ( newColData.mangas[i].selected == null || newColData.mangas[i].selected == false ) {
        newColData.mangas.splice(i, 1);
      } else {
        //Remove the 'selected' value from the entry to make compatible with server.
        delete newColData.mangas[i].selected;
        i++;
      }
    }

    let r;
    this.db.newCollection(newColData.name, newColData.mangas).subscribe(
      data => {
        r = data.body;
        if (r.success)
          this.openSnackBar("New Collection was Created Successfully!", "Awesome");
        this.dialogRef.disableClose = false;
      },
      err => {
        r = err.error;
        if (r.message == "No mangas selected")
          this.FormError.nullManga = true;
        else // Other HTTP Errors
          this.openSnackBar(r.message, "Okay.");
        this.dialogRef.disableClose = false;
    });

    this.collectionForm.reset();
  }

  private openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

}

/*
  Todo for collection factory:
    Make form look better.
    Make form give red warning if fields are unfiled (eg No manga selected or no name entered.)
*/
