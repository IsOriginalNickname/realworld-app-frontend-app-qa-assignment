import { Author } from "./author";

export interface ArticleComment {
    id: number;
    createdAt: string;
    updatedAt: string;
    body: string;
    author: Author;
}