export class ValidationError extends Error {
  readonly name = 'ValidationError';

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
