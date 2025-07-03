export interface CountryCode {
	country: string;
	code: string;
	dialCode: string;
	flag: string;
}

export const countryCodes: CountryCode[] = [
	{ country: '대한민국', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
	{ country: '미국', code: 'US', dialCode: '+1', flag: '🇺🇸' },
	{ country: '일본', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
	{ country: '중국', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
	{ country: '영국', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
	{ country: '프랑스', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
	{ country: '독일', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
	{ country: '이탈리아', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
	{ country: '스페인', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
	{ country: '캐나다', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
	{ country: '호주', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
	{ country: '싱가포르', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
	{ country: '홍콩', code: 'HK', dialCode: '+852', flag: '🇭🇰' },
	{ country: '태국', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
	{ country: '베트남', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
	{ country: '필리핀', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
	{ country: '인도', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
	{ country: '인도네시아', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
	{ country: '말레이시아', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
	{ country: '뉴질랜드', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
	{ country: '러시아', code: 'RU', dialCode: '+7', flag: '🇷🇺' },
	{ country: '브라질', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
	{ country: '멕시코', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
	{ country: '네덜란드', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
	{ country: '스위스', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
	{ country: '스웨덴', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
	{ country: '노르웨이', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
	{ country: '덴마크', code: 'DK', dialCode: '+45', flag: '🇩🇰' },
	{ country: '핀란드', code: 'FI', dialCode: '+358', flag: '🇫🇮' },
	{ country: '폴란드', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
	{ country: '오스트리아', code: 'AT', dialCode: '+43', flag: '🇦🇹' },
	{ country: '벨기에', code: 'BE', dialCode: '+32', flag: '🇧🇪' },
	{ country: '포르투갈', code: 'PT', dialCode: '+351', flag: '🇵🇹' },
	{ country: '그리스', code: 'GR', dialCode: '+30', flag: '🇬🇷' },
	{ country: '터키', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
	{ country: '남아프리카', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
	{ country: '아르헨티나', code: 'AR', dialCode: '+54', flag: '🇦🇷' },
	{ country: '칠레', code: 'CL', dialCode: '+56', flag: '🇨🇱' },
	{ country: '이스라엘', code: 'IL', dialCode: '+972', flag: '🇮🇱' },
	{ country: 'UAE', code: 'AE', dialCode: '+971', flag: '🇦🇪' }
];

export function getCountryByDialCode(dialCode: string): CountryCode | undefined {
	return countryCodes.find((c) => c.dialCode === dialCode);
}

export function getCountryByCode(code: string): CountryCode | undefined {
	return countryCodes.find((c) => c.code === code);
}
