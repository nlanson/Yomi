export interface MangaData {
  title: string;
  path: string;
  pageCount: string;
  cover: string;
}

export interface ReadMangaData extends MangaData{
  pages: Array<string>;
}

export type Status = 'success' | 'failure' | 'error';

export interface CommonAPIResult { //== CommonHandlerResult in Backend.
  status: Status;
  message: string;
  data?: any; //If it exists it could be any type. String, Object or null.
}

export interface CollectionInfo {
  name: string,
  id: string,
  mangas: Array<Partial<MangaData>>,
  count: number
}
