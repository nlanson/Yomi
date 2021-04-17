import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, UrlHandlingStrategy } from '@angular/router';
import { CommonAPIResult } from '../database/api.interfaces';

import { DatabaseService } from '../database/database.service';

@Component({
  selector: 'app-read',
  templateUrl: './read.component.html',
  styleUrls: ['./read.component.scss']
})
export class ReadComponent implements OnInit {

  sub: any;
  title: string;
  manga: any;

  page: number = 0;

  constructor(
    private route: ActivatedRoute,
    private db: DatabaseService
  ) { }

  async ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.title = params["title"];
    });

    let r: CommonAPIResult;
    this.db.getManga(this.title).subscribe(
      data => {
        r = data.body;
        if (r.success) {
          this.manga = r.content;
          this.preloadImages();
          console.log(this.manga)
        }
      },
      err => {
        r = err.error;
        this.manga = undefined;
        if (err.status == 411) {
          console.log(`${this.title} was not found in the database.`);
        } else {
          console.log(r);
          console.log(`Error (Unknown)`)
        }
      }
    );
  }

  minus() {
    if ( this.page != 0 ) {
      this.page--
    }
  }

  plus() {
    if ( this.page < this.manga.pages.length-1 ) {
      this.page++
    }
  }

  pageTyperChange(val) {
    if( val > this.manga.pages.length -1 ) {
      val = this.manga.pages.length-1
    } else if ( val < 0 ) {
      val = 0
    }

    this.page = val;
  }

  preloadImages() {
    for ( let i = 0; i < this.manga.pages.length; i++ ) {
      var tempImg = new Image();
      tempImg.src = this.manga.pages[i];
    }
  }

}
