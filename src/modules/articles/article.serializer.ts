import { Article } from 'src/database/entities/article.entity';

export enum ArticleViewType {
  BASIC_INFO = 'BASIC_INFO',
  FULL_INFO = 'FULL_INFO',
}

export class ArticleSerializer {
  private static readonly FIELD_MAP: Record<
    ArticleViewType,
    (keyof Article)[]
  > = {
    [ArticleViewType.BASIC_INFO]: ['articleId', 'title'],
    [ArticleViewType.FULL_INFO]: [
      'articleId',
      'title',
      'description',
      'author',
    ],
  };

  constructor(
    private readonly article: Article,
    private readonly options: { type: ArticleViewType },
  ) {}

  serialize(): Partial<Article> {
    const fields = ArticleSerializer.FIELD_MAP[this.options.type];

    return Object.fromEntries(
      fields.map((field) => [field, this.article[field]]),
    ) as Partial<Article>;
  }
}
