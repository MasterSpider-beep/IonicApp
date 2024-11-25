export const getLogger: (tag: string) => (...args: any) => void =
  tag => (...args) => console.log(tag, ...args);

const log = getLogger('api');

export const urlAPI = "http://localhost:3000";

export interface Book {
  id: number;
  title: string;
  releaseDate: string;
  quantity: number;
  isRentable: boolean;
  author: string;
  image: string;
  lat: number;
  long: number;
}

export interface ResponseProps<T> {
  data: T;
}

export function withLogs<T>(promise: Promise<ResponseProps<T>>, fnName: string): Promise<T> {
  log(`${fnName} - started`);
  return promise
    .then(res => {
      log(`${fnName} - succeeded`);
      return Promise.resolve(res.data);
    })
    .catch(err => {
      log(`${fnName} - failed`, err);
      return Promise.reject(err);
    });
}