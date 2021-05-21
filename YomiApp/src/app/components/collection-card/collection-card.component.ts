import { Component, OnInit, Input } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { CommonAPIResult } from '../../database/api.interfaces';
import { DatabaseService } from '../../database/database.service';
import { CollectionsComponent } from '../../collections/collections.component';


@Component({
  selector: 'Collection-Info',
  templateUrl: './collection-card.component.html',
  styleUrls: ['./collection-card.component.scss']
})
export class CollectionCardComponent implements OnInit {

  @Input() collection: any;

  constructor(
    private _snackBar: MatSnackBar,
    private db: DatabaseService,
    private collections: CollectionsComponent,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  //Open read page by title.
  public read(title: string) {
    console.log(`read ${title}`);
    this.router.navigate(['read', title]);
  }

  //Delete a collection by ID.
  public deleteCol(id: string) {
    let r: CommonAPIResult;
    this.db.deleteCollection(id).subscribe(
      data => {
        r = data.body;
        if (r.status == 'success'){
          this.openSnackBar('Collection has been deleted', 'Great');
          this.collections.getCollections();
        }
        else
          this.openSnackBar('Collection failed to delete', 'Damn.');
      },
      err => {
        r = err.error;
        if (r.status != 'success')
          this.openSnackBar(r.message, 'Damn.');
        else
          console.log(`err caught but status was declared as ${r.status}`)
      }
    )
  }

  private openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

}
