import { SetMetadata } from '@nestjs/common';

export const SKIP_STATUS_CHECK_KEY = 'skipStatusCheck';
export const SkipStatusCheck = () => SetMetadata(SKIP_STATUS_CHECK_KEY, true);
