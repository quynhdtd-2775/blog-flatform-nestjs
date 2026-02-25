export class GetArticlesQueryDto {
  tag?: string;
  author?: string;
  favorited?: boolean;
  limit?: number;
  offset?: number;
}
