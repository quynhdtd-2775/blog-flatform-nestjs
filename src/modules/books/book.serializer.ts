import { Book } from '../../database/entities/book.entity';

export function serializeBook(book: Book) {
  return {
    id: book.id,
    title: book.title,
    description: book.description,
    author: book.author ? { id: book.author.id, name: book.author.name } : null,
    publisher: book.publisher
      ? { id: book.publisher.id, name: book.publisher.name }
      : null,
    category: book.category
      ? { id: book.category.id, name: book.category.name }
      : null,
    totalQuantity: book.totalQuantity,
    availableQuantity: book.availableQuantity,
  };
}
