// src/lib/stores/userRole.ts
import { writable } from 'svelte/store';

// 사용자 역할을 저장할 스토어
export const userRole = writable<string>('unknown');

// 역할 설정 함수
export function setRole(role: string) {
	userRole.set(role);
}

// 역할 초기화 함수
export function resetRole() {
	userRole.set('unknown');
}
