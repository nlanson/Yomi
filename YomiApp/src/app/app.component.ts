import { Component, ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav'
import {MatSnackBar} from '@angular/material/snack-bar';
import { CommonAPIResult } from './database/api.interfaces';

import { DatabaseService } from './database/database.service';
import { LibraryComponent } from './library/library.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'YomiApp';
  @ViewChild('snav') snav: MatSidenav;

  constructor(
    private db: DatabaseService,
    private libc: LibraryComponent,
    private _snackBar: MatSnackBar
  ) { }


  async refreshdb() {
    let r: CommonAPIResult;
    this.db.refreshdb().subscribe(
      data =>{
        r = data.body;
        if ( r.status == 'success' ) {
          this.openSnackBar(r.message, 'Ok');
          this.libc.getList();
        }
      },
      err => {
        let r = err.error;
        console.log(err.error.message);
        this.openSnackBar('Epic Refresh Failure!', 'LOL');
      }
    );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

}
