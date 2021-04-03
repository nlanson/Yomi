import { Component, OnInit } from '@angular/core';
import { MangaData } from 'src/app/database/MangaInterface';
import { DatabaseService } from '../../database/database.service';

@Component({
  selector: 'app-collection-factory',
  templateUrl: './collection-factory.component.html',
  styleUrls: ['./collection-factory.component.scss']
})
export class CollectionFactoryComponent implements OnInit {

  public mangaList: Array<MangaData>;

  constructor(
    private db: DatabaseService
  ) { }

  async ngOnInit(): Promise<void> {
    this.getList();
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

}
