export interface UserOverride {
  status: 'active' | 'pending' | 'inactive' | 'deleted';
  role?: string;
  department?: string;
  updatedAt: number;
}

const globalForOverrides = globalThis as unknown as {
  syncroUserStatusOverrides?: Map<string, UserOverride>;
};

export const userStatusOverrides =
  globalForOverrides.syncroUserStatusOverrides ||
  (globalForOverrides.syncroUserStatusOverrides = new Map<string, UserOverride>());

