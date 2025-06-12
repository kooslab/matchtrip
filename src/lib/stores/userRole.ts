// src/lib/stores/userRole.ts
import { writable } from 'svelte/store';

// User role store - no localStorage persistence
// Role should come from server-side session only
export const userRole = writable<string>('unknown');

// 역할 설정 함수
export function setRole(role: string) {
	userRole.set(role);
}

// 역할 초기화 함수
export function resetRole() {
	userRole.set('unknown');
}
