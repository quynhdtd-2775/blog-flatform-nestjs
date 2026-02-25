import { Article } from 'src/database/entities/article.entity';

export class ArticleSerializer {
  constructor(private readonly article: Article) {}

  serialize() {
    return {
      slug: this.article.slug,
      title: this.article.title,
      description: this.article.description,
      body: this.article.body,
      tagList: this.article.tagList ?? [],
      createdAt: this.article.createdAt,
      updatedAt: this.article.updatedAt,
      favorited: false,
      favoritesCount: this.article.favoritesCount,
      author: {
        username: this.article.author.username,
        bio: this.article.author.bio,
        image: this.article.author.image,
        following: false,
      },
    };
  }
}
