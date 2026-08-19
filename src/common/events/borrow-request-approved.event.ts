export interface BorrowRequestApprovedEventBook {
  title: string;
  quantity: number;
}

export class BorrowRequestApprovedEvent {
  constructor(
    public readonly borrowRequestId: number,
    public readonly userId: number,
    public readonly userEmail: string,
    public readonly userName: string,
    public readonly fromDate: string,
    public readonly toDate: string,
    public readonly books: BorrowRequestApprovedEventBook[],
  ) {}
}
