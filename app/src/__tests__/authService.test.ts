import { authService } from '@/services/authService';
import type { User } from '@/types';

describe('AuthService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const user = await authService.register('test@example.com', 'password123', 'Test User');
      
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.analysisCount).toBe(0);
      expect(user.isPremium).toBe(false);
      expect(user.id).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      await authService.register('test@example.com', 'password123', 'Test User');
      
      await expect(
        authService.register('test@example.com', 'password456', 'Another User')
      ).rejects.toThrow('User already exists with this email');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register('test@example.com', 'password123', 'Test User');
    });

    it('should login with correct credentials', async () => {
      const user = await authService.login('test@example.com', 'password123');
      
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
    });

    it('should throw error for incorrect password', async () => {
      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should clear session on logout', async () => {
      await authService.register('test@example.com', 'password123', 'Test User');
      await authService.logout();
      
      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', async () => {
      const user = await authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return current user when logged in', async () => {
      await authService.register('test@example.com', 'password123', 'Test User');
      
      const user = await authService.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('incrementAnalysisCount', () => {
    it('should increment analysis count', async () => {
      const user = await authService.register('test@example.com', 'password123', 'Test User');
      
      await authService.incrementAnalysisCount(user.id);
      
      const currentUser = await authService.getCurrentUser();
      expect(currentUser?.analysisCount).toBe(1);
    });
  });
});
