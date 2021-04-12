export interface MangaData {
  title: string;
  path: string;
  pageCount: string;
  cover: string;
}

export interface CommonAPIResult { //== CommonHandlerResult in Backend.
  success: boolean;
  message: string;
  content?: any; //If it exists it could be any type. String, Object or null.
}
