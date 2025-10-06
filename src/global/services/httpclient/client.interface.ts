export interface fetchParameter {
  uri: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export interface postParameter extends Omit<fetchParameter, 'params'> {
  body: Record<string, any>;
}
