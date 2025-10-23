import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { WalletSets } from '../input/crypto.interface';

@Entity('walletsets')
export class WalletSet implements WalletSets {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @Column({ default: 'DEVELOPER' })
  custodyType: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp' })
  updateDate: Date;

  @Column({ type: 'timestamp' })
  createDate: Date;
}
