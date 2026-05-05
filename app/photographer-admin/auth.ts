'use client';

export const getPhotographerUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('photographerUser');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const getPhotographerToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('photographerToken');
};

export const logoutPhotographer = () => {
  localStorage.removeItem('photographerToken');
  localStorage.removeItem('photographerUser');
  window.location.href = '/photographer-login';
};