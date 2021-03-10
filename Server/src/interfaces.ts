export interface CommonHandlerResult {
    success: Boolean,
    message: string
}

export interface CollectionInterface {
    name: string;
    mangas: Array<string>;
    count: number;
    add( manga: string ): void;
    remove( manga: string ): CommonHandlerResult;
    edit( newName: string ): void;
}
