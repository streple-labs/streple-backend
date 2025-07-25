import { controllerAbilities } from './ability.control';
import { action, Role } from './ability.interface';

export function AbilityFunction(
  route: string,
  role: Role,
  act: action,
): boolean {
  const routeAbilities = controllerAbilities[route];

  if (!routeAbilities) {
    throw new Error(`Invalid endpoint: ${route}`);
  }

  const roleAbility = routeAbilities[role];

  if (!roleAbility) {
    throw new Error(`Invalid user role: ${role}`);
  }

  if (roleAbility.can.includes(act)) {
    return true;
  }

  if (roleAbility.cannot?.includes(act)) {
    return false;
  }

  return false;
}
