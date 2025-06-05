import bcrypt from 'bcrypt';
import { storage } from './storage';
import type { InsertUser } from '@shared/schema';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function registerUser(userData: {
  username: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    // Check if username already exists
    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      return { success: false, message: 'Username already exists' };
    }

    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      return { success: false, message: 'Email already exists' };
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const newUser: InsertUser = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      preferences: null,
    };

    const user = await storage.createLocalUser(newUser);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return { 
      success: true, 
      message: 'User created successfully',
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, message: 'Failed to create user' };
  }
}

export async function loginUser(credentials: {
  username: string;
  password: string;
}): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    // Find user by username
    const user = await storage.getUserByUsername(credentials.username);
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(credentials.password, user.password);
    if (!isValidPassword) {
      return { success: false, message: 'Invalid username or password' };
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return { 
      success: true, 
      message: 'Login successful',
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    return { success: false, message: 'Login failed' };
  }
}