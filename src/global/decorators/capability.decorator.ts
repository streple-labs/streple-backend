import { SetMetadata } from '@nestjs/common';

export const CAPABILITY_KEY = 'abilities';
export const Abilities = (...caps: string[]) =>
  SetMetadata(CAPABILITY_KEY, caps);
