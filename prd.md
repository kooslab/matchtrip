# Product Requirements Document (PRD)

## Typography System

### Font Family

- **Primary Font**: Pretendard
- **Download Link**: https://cactus.tistory.com/306
- **Font Weights**: Bold (700), SemiBold (600), Medium (500), Regular (400)

### Color Palette

#### Primary Colors

- **Primary**: #1095f4
- **Secondary**: #8ea0ac

#### Greyscale

- **Black**: #052236
- **Gray 66**: #666666 (default gray for secondary text)
- **Gray 99**: #919fa8
- **Gray C8**: #c9ccce
- **Gray E1**: #e1e1e1
- **Gray F1**: #f1f1f1
- **Gray F7**: #f7f9fa (light background)
- **White**: #ffffff

#### Accent Colors

- **Red**: #f72b2b
- **Orange**: #f75b2b
- **Yellow**: #fbbc05
- **Green**: #19b989
- **Sky Blue**: #4daeeb
- **Blue**: #0054e9
- **Navy**: #191a54
- **Purple**: #894deb

#### Alert Colors

- **Success**: #19b989 (same as Green)
- **Error**: #f72b2b (same as Red)

### Heading Styles

| Level     | Font Size | Line Height | Font Weight |
| --------- | --------- | ----------- | ----------- |
| Heading 1 | 24px      | 36px        | Bold        |
| Heading 2 | 22px      | 32px        | Bold        |
| Heading 3 | 20px      | 32px        | Bold        |
| Heading 4 | 18px      | 28px        | Bold        |
| Heading 5 | 16px      | 24px        | Bold        |
| Heading 6 | 14px      | 20px        | Bold        |

### Body Text Styles

| Style        | Font Size | Line Height                    | Font Weight | Notes             |
| ------------ | --------- | ------------------------------ | ----------- | ----------------- |
| Body Large   | 13px      | 20px                           | Regular     |                   |
| Body Medium  | 12px      | 18px (Korean) / 16px (English) | Regular     | Default body text |
| Body Small   | 11px      | 16px                           | Regular     |                   |
| Body X-Small | 10px      | 12px                           | Regular     |                   |
| Label        | 9px       | 12px                           | SemiBold    | For small labels  |

### Typography Implementation Notes

1. **Font Loading**: Ensure Pretendard font is properly loaded before rendering text
2. **Line Height**: Korean text generally requires slightly more line height than English text
3. **Letter Spacing**: Most text uses default letter spacing, with some headings having slight negative tracking
4. **Text Color**: Primary text uses #052236, secondary text uses #666666
5. **Responsive Design**: Typography should scale appropriately on different screen sizes

### Global CSS Variables

```css
:root {
	/* Primary Colors */
	--color-primary: #1095f4;
	--color-secondary: #8ea0ac;

	/* Greyscale */
	--color-black: #052236;
	--color-text-primary: #052236;
	--color-text-secondary: #666666;
	--color-gray-99: #919fa8;
	--color-gray-c8: #c9ccce;
	--color-gray-e1: #e1e1e1;
	--color-gray-f1: #f1f1f1;
	--color-gray-f7: #f7f9fa;
	--color-bg-light: #f7f9fa;
	--color-white: #ffffff;

	/* Accent Colors */
	--color-red: #f72b2b;
	--color-orange: #f75b2b;
	--color-yellow: #fbbc05;
	--color-green: #19b989;
	--color-sky-blue: #4daeeb;
	--color-blue: #0054e9;
	--color-navy: #191a54;
	--color-purple: #894deb;

	/* Alert Colors */
	--color-success: #19b989;
	--color-error: #f72b2b;

	/* Typography - Headings */
	--font-size-h1: 24px;
	--line-height-h1: 36px;
	--font-size-h2: 22px;
	--line-height-h2: 32px;
	--font-size-h3: 20px;
	--line-height-h3: 32px;
	--font-size-h4: 18px;
	--line-height-h4: 28px;
	--font-size-h5: 16px;
	--line-height-h5: 24px;
	--font-size-h6: 14px;
	--line-height-h6: 20px;

	/* Typography - Body */
	--font-size-body-large: 13px;
	--line-height-body-large: 20px;
	--font-size-body-medium: 12px;
	--line-height-body-medium: 18px;
	--font-size-body-small: 11px;
	--line-height-body-small: 16px;
	--font-size-body-xsmall: 10px;
	--line-height-body-xsmall: 12px;
	--font-size-label: 9px;
	--line-height-label: 12px;

	/* Font Weights */
	--font-weight-bold: 700;
	--font-weight-semibold: 600;
	--font-weight-medium: 500;
	--font-weight-regular: 400;

	/* Spacing */
	--spacing-4: 4px;
	--spacing-8: 8px;
	--spacing-12: 12px;
	--spacing-16: 16px;
	--spacing-20: 20px;
	--spacing-24: 24px;
	--spacing-32: 32px;
	--spacing-40: 40px;
}
```

### Usage Guidelines

1. **Headings**: Use for section titles and important information hierarchy
2. **Body Text**: Use Body Medium (12px) as the default for most content
3. **Labels**: Use the Label style (9px) for small UI elements and metadata
4. **Color Contrast**: Ensure sufficient contrast between text and background colors
5. **Consistency**: Apply these styles consistently throughout the application

## Spacing System

### 8-Point Grid System

The application uses an 8pt linear scale for elements and 4pt for spacing icons or small text blocks. All spacing values are divisible by 4 to maintain consistency.

#### Spacing Scale

- **4px**: Minimum spacing unit for small gaps
- **8px**: Extra small spacing
- **12px**: Small spacing
- **16px**: Medium spacing (default)
- **20px**: Medium-large spacing
- **24px**: Large spacing
- **32px**: Extra large spacing
- **40px**: Maximum spacing
