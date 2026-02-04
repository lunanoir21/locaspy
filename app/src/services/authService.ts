import type { User } from '@/types';

// Simulated backend with localStorage persistence
class AuthService {
  private readonly STORAGE_KEY = 'geospy_users';
  private readonly SESSION_KEY = 'geospy_session';

  private getUsers(): Array<User & { password: string }> {
    const users = localStorage.getItem(this.STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  }

  private saveUsers(users: Array<User & { password: string }>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }

  async register(email: string, password: string, name: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        
        // Check if user already exists
        if (users.find(u => u.email === email)) {
          reject(new Error('User already exists with this email'));
          return;
        }

        // Create new user
        const newUser: User & { password: string } = {
          id: crypto.randomUUID(),
          email,
          password, // In real app, this would be hashed
          name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          createdAt: new Date(),
          analysisCount: 0,
          isPremium: false
        };

        users.push(newUser);
        this.saveUsers(users);

        // Create session
        const { password: _, ...userWithoutPassword } = newUser;
        this.setSession(userWithoutPassword);
        
        resolve(userWithoutPassword);
      }, 800); // Simulate network delay
    });
  }

  async login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
          reject(new Error('Invalid email or password'));
          return;
        }

        const { password: _, ...userWithoutPassword } = user;
        this.setSession(userWithoutPassword);
        
        resolve(userWithoutPassword);
      }, 600);
    });
  }

  async logout(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem(this.SESSION_KEY);
        resolve();
      }, 300);
    });
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const session = localStorage.getItem(this.SESSION_KEY);
        resolve(session ? JSON.parse(session) : null);
      }, 200);
    });
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
          reject(new Error('User not found'));
          return;
        }

        users[userIndex] = { ...users[userIndex], ...updates };
        this.saveUsers(users);

        const { password: _, ...userWithoutPassword } = users[userIndex];
        this.setSession(userWithoutPassword);
        
        resolve(userWithoutPassword);
      }, 500);
    });
  }

  async incrementAnalysisCount(userId: string): Promise<void> {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].analysisCount++;
      this.saveUsers(users);
      
      const { password: _, ...userWithoutPassword } = users[userIndex];
      this.setSession(userWithoutPassword);
    }
  }

  private setSession(user: User): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  }

  // Social login simulation
  async loginWithGoogle(): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate Google OAuth
        const mockEmail = `user${Date.now()}@gmail.com`;
        const mockName = 'Google User';
        
        this.register(mockEmail, crypto.randomUUID(), mockName)
          .then(resolve)
          .catch(() => {
            // If already exists, try to login
            this.login(mockEmail, '').catch(reject);
          });
      }, 1000);
    });
  }

  async resetPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
          reject(new Error('No account found with this email'));
          return;
        }

        // In real app, send reset email
        console.log(`Password reset link sent to ${email}`);
        resolve();
      }, 800);
    });
  }
}

export const authService = new AuthService();
export default authService;
