export interface BorrowRequestApprovedTemplateData {
  name: string;
  borrowRequestId: number;
  fromDate: string;
  toDate: string;
  books: { title: string; quantity: number }[];
}

export interface BorrowRequestRejectedTemplateData {
  name: string;
  borrowRequestId: number;
  fromDate: string;
  toDate: string;
  rejectReason: string | null;
}

export const BORROW_REQUEST_APPROVED_SUBJECT =
  'Your library borrow request has been approved';
export const BORROW_REQUEST_REJECTED_SUBJECT =
  'Your library borrow request has been rejected';

export function buildBorrowRequestApprovedEmail(
  data: BorrowRequestApprovedTemplateData,
): string {
  const booksList = data.books.length
    ? `<ul>${data.books
        .map((book) => `<li>${book.title} (x${book.quantity})</li>`)
        .join('')}</ul>`
    : '';

  return `
    <p>Hello ${data.name},</p>
    <p>Your borrow request #${data.borrowRequestId} has been <strong>approved</strong>.</p>
    <p>Borrow date: ${data.fromDate}</p>
    <p>Return/due date: ${data.toDate}</p>
    ${booksList}
    <p>Please visit the library to collect your books within the borrow period.</p>
  `;
}

export function buildBorrowRequestRejectedEmail(
  data: BorrowRequestRejectedTemplateData,
): string {
  return `
    <p>Hello ${data.name},</p>
    <p>Your request to borrow books from the library has been <strong>rejected</strong>.</p>
    <p>Request #${data.borrowRequestId}</p>
    <p>Borrow date: ${data.fromDate}</p>
    <p>Return/due date: ${data.toDate}</p>
    <p>Reason:</p>
    <p>${data.rejectReason ?? 'No reason provided.'}</p>
    <p>Please check your request for more information, or submit a new request.</p>
  `;
}
