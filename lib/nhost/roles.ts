/**
 * lib/nhost/roles.ts
 *
 * Account role model. Users pick a specific ROLE at signup (shown grouped by
 * user type); the internal USER_TYPE is derived from that choice. Both are
 * stored in the Nhost user's `metadata` field.
 */

export type UserType = "business" | "consumer";

export type Role =
  | "restaurant"
  | "chef"
  | "homecook"
  | "enthusiast"
  | "first-timer";

export interface RoleOption {
  role: Role;
  label: string;
  userType: UserType;
}

/** Every selectable role, in display order. Grouped by userType in the UI. */
export const ROLE_OPTIONS: RoleOption[] = [
  { role: "restaurant", label: "Restaurant", userType: "business" },
  { role: "chef", label: "Chef", userType: "business" },
  { role: "homecook", label: "Home cook", userType: "consumer" },
  { role: "enthusiast", label: "Enthusiast", userType: "consumer" },
  { role: "first-timer", label: "First-timer", userType: "consumer" },
];

const ROLE_TO_USER_TYPE: Record<Role, UserType> = ROLE_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.role] = opt.userType;
    return acc;
  },
  {} as Record<Role, UserType>
);

/** Internal user type ("business" | "consumer") for a given role. */
export function userTypeForRole(role: Role): UserType {
  return ROLE_TO_USER_TYPE[role];
}

/** Human-friendly labels keyed by userType, for grouping the role picker. */
export const USER_TYPE_LABELS: Record<UserType, string> = {
  business: "Business",
  consumer: "Consumer",
};

/**
 * Where to send a user after login. Everyone currently lands on the diner-facing
 * dishes feed: /recipes (the business operator surface) is temporarily deprecated
 * pending a terms-of-use review, so businesses fall through to /dishes too. Restore
 * the "business" → "/recipes" branch when that page comes back.
 */
export function landingPathForUserType(userType: UserType | null | undefined): string {
  return userType === "business" ? "/dishes" : "/dishes";
}
