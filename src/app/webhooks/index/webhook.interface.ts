import { transactionStatus } from '@app/wallets/input';

export interface PublicKeyResponse {
  data: {
    id: string;
    algorithm: string;
    publicKey: string;
    createDate: Date;
  };
}

export interface notification {
  id: string;
  blockchain: string;
  walletId: string;
  tokenId: string;
  sourceAddress: string;
  destinationAddress: string;
  amounts: string[];
  nftTokenIds: any;
  refId: string;
  state: transactionStatus;
  errorReason: string;
  transactionType: 'OUTBOUND' | 'INBOUND';
  txHash: string;
  userOpHash: string;
  createDate: Date;
  updateDate: Date;
  errorDetails: null;
  networkFee?: string;
}

export enum notificationType {
  inbound = 'transactions.outbound',
  outbound = 'transactions.inbound',
  test = 'webhooks.test',
}
export interface TransactionBound {
  subscriptionId: string;
  notificationId: string;
  notificationType: notificationType;
  notification: notification;
  timestamp: Date;
  version: number;
}
