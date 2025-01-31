export interface ErrorDetail {
  message: string;
  code?: string;
  field?: string;
}

export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public errors?: ErrorDetail[];
  private readonly _value?: T;

  private constructor(isSuccess: boolean, value?: T, errors?: ErrorDetail[]) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.errors = errors;
    this._value = value;

    if (isSuccess && errors) {
      throw new Error(
        "InvalidOperation: A successful result cannot have errors"
      );
    }
    if (!isSuccess && !errors) {
      throw new Error(
        "InvalidOperation: A failed result must have at least one error"
      );
    }
  }

  public get value(): T {
    if (!this.isSuccess) {
      throw new Error("Cannot get the value of a failed result");
    }
      return this._value;
  }

  public static Ok<U>(value?: U): Result<U> {
    return new Result<U>(true, value);
  }

  public static Fail<U>(errors: ErrorDetail[]): Result<U> {
    return new Result<U>(false, undefined, errors);
  }
}
