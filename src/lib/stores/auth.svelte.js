import { browser } from '$app/environment';

class AuthState {
  #user = $state(null);
  #token = $state('');

  constructor() {
    if (browser) {
      const savedUser = localStorage.getItem('auth_user');
      const savedToken = localStorage.getItem('auth_token');
      if (savedUser && savedToken) {
        try {
          this.#user = JSON.parse(savedUser);
          this.#token = savedToken;
        } catch (e) {
          this.logout();
        }
      }
    }
  }

  // Reactive getters
  get user() {
    return this.#user;
  }

  get token() {
    return this.#token;
  }

  get isAuthenticated() {
    return !!this.#user;
  }

  get id_sekolah() {
    return this.#user?.id_sekolah || '';
  }

  get role() {
    return this.#user?.role || '';
  }

  get id_user() {
    return this.#user?.id_user || null;
  }

  get username() {
    return this.#user?.username || '';
  }

  login(user, token) {
    this.#user = {
      id_sekolah: user.id_sekolah || '',
      role: user.role || '',
      id_user: user.id_user || null,
      username: user.username || ''
    };
    this.#token = token;

    if (browser) {
      localStorage.setItem('auth_user', JSON.stringify(this.#user));
      localStorage.setItem('auth_token', token);
      
      // Sync JWT token to cookie for SSR compatibility
      document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Strict; Secure`;
    }
  }

  logout() {
    this.#user = null;
    this.#token = '';

    if (browser) {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      
      // Clear cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    }
  }
}

export const authState = new AuthState();
