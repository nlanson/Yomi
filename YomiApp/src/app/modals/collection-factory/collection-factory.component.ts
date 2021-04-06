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
      mangas: [null] //NEED TO MAKE A FORM ARRAY
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

  submit() {
    console.log(this.collectionForm.value);
  }

}
