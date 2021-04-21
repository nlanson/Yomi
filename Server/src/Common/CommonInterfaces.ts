import { Collection } from "../Collections/Collection";

export type Status = 'success' | 'failure' | 'error';

export interface CommonHandlerResult {
    status: Status,
    data?: any,
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
}

export interface CollectionSaveFile {
    save_data: Array<Collection>
}
