import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CryptoWallet, WalletSets } from '../input';
import { IUser } from '@app/users/interface';
import { User } from '@app/users/entity';
import { WalletSet } from './walletset.entity';

@Entity('crypto-accounts')
export class CryptoAccounts implements CryptoWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  circleId: string; //id of the response from circle

  @Column()
  state: string; //LIVE

  @Column({ type: 'uuid' })
  walletSetId: string;

  @ManyToOne(() => WalletSet, { onDelete: 'CASCADE' })
  walletSet: WalletSets;

  @Column()
  custodyType: string; //'DEVELOPER';

  @Index()
  @Column({ unique: true })
  address: string;

  @Column()
  blockchain: string;

  @Column({ nullable: true })
  initialPublicKey?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  refId?: string;

  @Column({ nullable: true })
  circleUserId?: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: IUser;

  @Column({ default: 'SCA' })
  accountType: string; //'SCA';

  @Column({ default: 'circle_6900_singleowner_v3' })
  scaCore: string;

  @Column({ type: 'timestamp' })
  updateDate: Date;

  @Column({ type: 'timestamp' })
  createDate: Date;
}
