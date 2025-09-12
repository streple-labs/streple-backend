import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom, map, retry, timeout, timer } from 'rxjs';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  constructor(private readonly httpService: HttpService) {}

  onApplicationBootstrap() {
    this.httpService.axiosRef.defaults.timeout = 30_000;
  }
  public fetchData = async <T extends object | object[]>(
    uri: string,
    header?: Record<string, string>,
  ) => {
    const response = await firstValueFrom(
      this.httpService
        .get<T>(uri, {
          headers: header,
        })
        .pipe(
          retry({
            count: 3,
            delay: (error, retryCount) => {
              this.logger.warn(
                `Retrying request... attempt #${retryCount} after error: ${error.message}`,
              );
              return new Promise((res) => setTimeout(res, retryCount * 2000));
            },
          }),
          catchError((error: AxiosError) => {
            if (error?.response) {
              this.logger.error(error.response.data);
            }
            throw error;
          }),
        ),
    );

    return response;
  };

  async postData<T = unknown>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    return firstValueFrom(
      this.httpService.post<T>(url, body, { headers }).pipe(
        retry({
          count: 3,
          delay: (err: AxiosError, retryCount) => {
            const canRetry = !err.response || err.response.status >= 500;
            if (!canRetry) throw err;

            this.logger.warn(
              `POST ${url} – retry ${retryCount}/3 after ${err.message}`,
            );
            return timer(retryCount * 2000); // linear backoff
          },
        }),
        timeout(35_000),
        map((res: AxiosResponse<T>) => res.data),
        catchError((err: AxiosError) => {
          const code = err.response?.status || 0;
          const payload = err.response?.data;
          this.logger.error(
            `POST ${url} failed after retries – ${code} ${JSON.stringify(payload)}`,
          );
          throw new ForbiddenException(`${err.message}`);
        }),
      ),
    );
  }
}
