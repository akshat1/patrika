/***
 * @see https://www.npmjs.com/package/picodb
 */

declare module "picodb" {
  type Query = Record<string, unknown>;
  type Callback = () => void;
  interface ReturnedCollection<DocumentType> {
    toArray: () => Promise<DocumentType[]>;
  }

  export default class PicoDB<DocumentType> {
    constructor ();
    count: () => Promise<number>;
    deleteMany: (query: Query) => Promise<void>;
    deleteOne: (query: Query) => Promise<void>;
    insertMany: (data: DocumentType[]) => Promise<DocumentType[]>;
    insertOne: (data: DocumentType) => Promise<DocumentType>;
    updateMany: (query: Query, data: DocumentType) => Promise<DocumentType[]>;
    updateOne: (query: Query, data: DocumentType) => Promise<DocumentType>;
    find: (query?: Query, projection?: Record<string, unknown>) => ReturnedCollection<DocumentType>;
    toArray: () => Promise<DocumentType[]>;
    on: (eventName: string, Callback) => Promise<void>;
    one: (eventName: string, Callback) => Promise<Record<string, unknown>>;
    off: (eventName: string, Callback) => Promise<void>;
  }
}
