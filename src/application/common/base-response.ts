// Base Response Structure for all API responses
export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  FAILURE = 'failure',
}

export enum ResponseCode {
  SUCCESS = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_ERROR = 500,
}

export interface BaseResponse<T = any> {
  message: string;
  data: T;
  status: ResponseStatus;
  code: ResponseCode;
}

export class ResponseBuilder {
  static success<T>(data: T, message: string = 'Success', code: ResponseCode = ResponseCode.SUCCESS): BaseResponse<T> {
    return {
      message,
      data,
      status: ResponseStatus.SUCCESS,
      code,
    };
  }

  static error(message: string, code: ResponseCode = ResponseCode.BAD_REQUEST, data: any = null): BaseResponse {
    return {
      message,
      data,
      status: ResponseStatus.ERROR,
      code,
    };
  }

  static failure(message: string, code: ResponseCode = ResponseCode.INTERNAL_ERROR, data: any = null): BaseResponse {
    return {
      message,
      data,
      status: ResponseStatus.FAILURE,
      code,
    };
  }
}



