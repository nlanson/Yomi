import { Component, OnInit, Input } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { CollectionInfo, CommonAPIResult } from '../../database/api.interfaces';
import { DatabaseService } from '../../database/database.service';
import { CollectionsComponent } from '../../collections/collections.component';


@Component({
  selector: 'Collection-Info',
  templateUrl: './collection-card.component.html',
  styleUrls: ['./collection-card.component.scss']
})
export class CollectionCardComponent implements OnInit {

  @Input() collection: CollectionInfo;
  public loading: boolean = true;

  constructor(
    private _snackBar: MatSnackBar,
    private db: DatabaseService,
    private collections: CollectionsComponent,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getDetailsForEachManga();
  }

  //Open read page by title.
  public read(title: string) {
    console.log(`read ${title}`);
    this.router.navigate(['read', title]);
  }

  //Load manga data for each manga in a collection so we can use the Book-Card component.
  private getDetailsForEachManga() {
    this.loading = true;
    for(let i=0; i<this.collection.mangas.length; i++) {
      this.db.getManga(this.collection.mangas[i].title).subscribe(
        data => {
          let d = data.body;
          this.collection.mangas[i].cover = d.data.cover;
          this.collection.mangas[i].path = d.data.path;
          this.collection.mangas[i].pageCount = d.data.pageCount;
        }
      );
    }
    this.loading = false;
  }

  public deleteCol() {
    this.collections.deleteCol(this.collection.id);
  }

}
