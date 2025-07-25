import { action } from '../ability.interface';

export const WalletAbilities = {
  USER: {
    can: [action.read, action.search, action.create],
    cannot: [action.manage, action.update, action.delete],
  },
  ADMIN: {
    can: [action.create],
  },
};
