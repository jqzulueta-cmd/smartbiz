import 'next-auth';
import 'next-auth/jwt';
import type { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      branchId: string | null;
      branchName: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    branchId: string | null;
    branchName: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    branchId: string | null;
    branchName: string | null;
  }
}
