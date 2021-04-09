import { Component, OnInit, ViewChild } from '@angular/core';
import { MangaData } from 'src/app/database/MangaInterface';
import { DatabaseService } from '../../database/database.service';

import { FormBuilder, FormGroup, FormArray } from '@angular/forms';

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
    private fb: FormBuilder
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

  submit() {
    console.log(this.collectionForm.value);

    //validate form value here (eg set checkbox null values to false)
    //send to database service
  }

}
