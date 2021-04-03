export interface CommonHandlerResult {
    success: Boolean,
    message: string
}

export interface CollectionInterface {
    name: string;
    mangas: Array<CollectionMangaData>;
    count: number;
    addEntry( manga: CollectionMangaData ): void;
    removeEntry( manga: string ): CommonHandlerResult;
    editCollectionName( newName: string ): void;
}

export interface CollectionMangaData {
    title: string;
    path: string;
    pageCount: number;
    cover: string;
}

export interface dbapi_common_interface {
    success: boolean;
    message: string;
    content: any;
}
