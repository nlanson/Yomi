import { Component, OnInit } from '@angular/core';

import { DatabaseService } from '../../database/database.service';

@Component({
  selector: 'app-upload-manga',
  templateUrl: './upload-manga.component.html',
  styleUrls: ['./upload-manga.component.scss']
})
export class UploadMangaComponent implements OnInit {


  constructor(
    private db: DatabaseService
  ) { }

  ngOnInit(): void {
  }
}
