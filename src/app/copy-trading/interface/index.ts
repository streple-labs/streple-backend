import { IUser } from '@app/users/interface';

export interface ICopyWallet {
  id: string;
  user: IUser;
  proTraderId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}
