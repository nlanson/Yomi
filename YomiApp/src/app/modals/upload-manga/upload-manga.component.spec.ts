import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadMangaComponent } from './upload-manga.component';

describe('UploadMangaComponent', () => {
  let component: UploadMangaComponent;
  let fixture: ComponentFixture<UploadMangaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadMangaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadMangaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
