// src/lib/stores/userRole.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// 브라우저에서 localStorage에서 역할 읽기
function getInitialRole(): string {
	if (browser) {
		return localStorage.getItem('userRole') || 'unknown';
	}
	return 'unknown';
}

// 사용자 역할을 저장할 스토어 (localStorage와 동기화)
export const userRole = writable<string>(getInitialRole());

// 역할 설정 함수
export function setRole(role: string) {
	userRole.set(role);
	if (browser) {
		localStorage.setItem('userRole', role);
	}
}

// 역할 초기화 함수
export function resetRole() {
	userRole.set('unknown');
	if (browser) {
		localStorage.removeItem('userRole');
	}
}
