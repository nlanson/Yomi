import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

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

    console.log(this.title);
    let res = await this.db.getManga(this.title);

    if ( res.status == 200 ) {
      console.log(res.body);
      this.manga = res.body;
    } else if ( res.status == 411 ) {
      console.log(`${this.title} was not found in the database.`);
      this.manga = undefined;
    } else {
      console.log(`Error (Unknown)`)
    }
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

}
