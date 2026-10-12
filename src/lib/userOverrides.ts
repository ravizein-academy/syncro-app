// Shared user overrides map for status approval (persisted in server memory)
export interface UserOverride {
  status: 'active' | 'pending' | 'inactive';
  role?: string;
  department?: string;
  updatedAt: number;
}

const globalForOverrides = globalThis as unknown as {
  syncroUserStatusOverrides?: Map<string, UserOverride>;
};

export const userStatusOverrides =
  globalForOverrides.syncroUserStatusOverrides || new Map<string, UserOverride>();

if (process.env.NODE_ENV !== 'production') {
  globalForOverrides.syncroUserStatusOverrides = userStatusOverrides;
}
