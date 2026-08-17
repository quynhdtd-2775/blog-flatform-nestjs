import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBorrowRequestDto } from './create-borrow-request.dto';

describe('CreateBorrowRequestDto', () => {
  const baseInput = {
    fromDate: '2026-08-10',
    toDate: '2026-08-17',
    books: [{ bookId: 1, quantity: 1 }],
  };

  it('passes when fromDate is before toDate', async () => {
    const dto = plainToInstance(CreateBorrowRequestDto, baseInput);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects when fromDate is after toDate', async () => {
    const dto = plainToInstance(CreateBorrowRequestDto, {
      ...baseInput,
      fromDate: '2026-08-17',
      toDate: '2026-08-10',
    });

    const errors = await validate(dto);
    const fromDateError = errors.find((error) => error.property === 'fromDate');

    expect(fromDateError).toBeDefined();
    expect(fromDateError?.constraints).toHaveProperty('isBeforeDate');
  });

  it('rejects when fromDate equals toDate', async () => {
    const dto = plainToInstance(CreateBorrowRequestDto, {
      ...baseInput,
      fromDate: '2026-08-10',
      toDate: '2026-08-10',
    });

    const errors = await validate(dto);
    const fromDateError = errors.find((error) => error.property === 'fromDate');

    expect(fromDateError).toBeDefined();
  });

  it('rejects when fromDate is not a valid date string', async () => {
    const dto = plainToInstance(CreateBorrowRequestDto, {
      ...baseInput,
      fromDate: 'not-a-date',
    });

    const errors = await validate(dto);
    const fromDateError = errors.find((error) => error.property === 'fromDate');

    expect(fromDateError).toBeDefined();
    expect(fromDateError?.constraints).toHaveProperty('isDateString');
  });

  it('rejects when books is empty', async () => {
    const dto = plainToInstance(CreateBorrowRequestDto, {
      ...baseInput,
      books: [],
    });

    const errors = await validate(dto);
    const booksError = errors.find((error) => error.property === 'books');

    expect(booksError).toBeDefined();
  });
});
