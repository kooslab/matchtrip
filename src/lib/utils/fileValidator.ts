/**
 * File validation utility with security best practices
 */

// Allowed file types with their MIME types
export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
	// Images
	'image/jpeg': ['.jpg', '.jpeg'],
	'image/png': ['.png'],
	'image/webp': ['.webp'],
	// Documents
	'application/pdf': ['.pdf']
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
	image: 5 * 1024 * 1024, // 5MB for images
	document: 10 * 1024 * 1024, // 10MB for documents
	default: 5 * 1024 * 1024 // 5MB default
} as const;

export interface FileValidationResult {
	isValid: boolean;
	error?: string;
	fileInfo?: {
		name: string;
		size: number;
		type: string;
		sizeFormatted: string;
	};
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
	const lastDotIndex = filename.lastIndexOf('.');
	if (lastDotIndex === -1) {
		return ''; // No extension found
	}
	return filename.toLowerCase().substring(lastDotIndex);
}

/**
 * Check if file type is allowed based on MIME type and extension
 */
function isFileTypeAllowed(file: File): boolean {
	const mimeType = file.type.toLowerCase();
	const extension = getFileExtension(file.name);

	// Check if MIME type is in allowed list
	if (!(mimeType in ALLOWED_FILE_TYPES)) {
		return false;
	}

	// Check if extension matches the MIME type
	const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];
	return allowedExtensions?.includes(extension) || false;
}

/**
 * Get appropriate size limit based on file type
 */
function getSizeLimit(file: File): number {
	if (file.type.startsWith('image/')) {
		return FILE_SIZE_LIMITS.image;
	} else if (file.type === 'application/pdf') {
		return FILE_SIZE_LIMITS.document;
	}
	return FILE_SIZE_LIMITS.default;
}

/**
 * Validate a single file
 */
export function validateFile(file: File): FileValidationResult {
	const fileInfo = {
		name: file.name,
		size: file.size,
		type: file.type,
		sizeFormatted: formatFileSize(file.size)
	};

	// Check if file exists
	if (!file) {
		return {
			isValid: false,
			error: '파일이 선택되지 않았습니다.',
			fileInfo
		};
	}

	// Check file name length
	if (file.name.length > 255) {
		return {
			isValid: false,
			error: '파일명이 너무 깁니다. (최대 255자)',
			fileInfo
		};
	}

	// Check for suspicious file names
	const suspiciousPatterns = [
		/\.(exe|bat|cmd|scr|pif|com)$/i,
		/^\./, // Hidden files
		/[<>:"|?*]/ // Invalid characters
	];

	if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
		return {
			isValid: false,
			error: '허용되지 않는 파일명입니다.',
			fileInfo
		};
	}

	// Check file type
	if (!isFileTypeAllowed(file)) {
		const allowedTypes = Object.values(ALLOWED_FILE_TYPES).flat().join(', ');
		return {
			isValid: false,
			error: `허용되지 않는 파일 형식입니다. 허용 형식: ${allowedTypes}`,
			fileInfo
		};
	}

	// Check file size
	const sizeLimit = getSizeLimit(file);
	if (file.size > sizeLimit) {
		return {
			isValid: false,
			error: `파일 크기가 너무 큽니다. 최대 크기: ${formatFileSize(sizeLimit)}`,
			fileInfo
		};
	}

	// Check minimum file size (avoid empty files)
	if (file.size < 100) {
		return {
			isValid: false,
			error: '파일이 너무 작습니다. 유효한 파일을 선택해주세요.',
			fileInfo
		};
	}

	return {
		isValid: true,
		fileInfo
	};
}

/**
 * Validate multiple files
 */
export function validateFiles(files: FileList | File[]): FileValidationResult[] {
	const fileArray = Array.from(files);
	return fileArray.map((file) => validateFile(file));
}

/**
 * Get accept attribute string for input elements
 */
export function getAcceptString(): string {
	const extensions = Object.values(ALLOWED_FILE_TYPES).flat();
	const mimeTypes = Object.keys(ALLOWED_FILE_TYPES);
	return [...mimeTypes, ...extensions].join(',');
}

/**
 * Create a file input handler with validation
 */
export function createFileInputHandler(
	onSuccess: (file: File, result: FileValidationResult) => void,
	onError: (error: string, result: FileValidationResult) => void
) {
	return (event: Event) => {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (!files || files.length === 0) {
			onError('파일이 선택되지 않았습니다.', { isValid: false });
			return;
		}

		const file = files[0];
		const result = validateFile(file);

		if (result.isValid) {
			onSuccess(file, result);
		} else {
			onError(result.error || '파일 검증에 실패했습니다.', result);
			// Clear the input
			target.value = '';
		}
	};
}
