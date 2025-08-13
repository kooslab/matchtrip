<script lang="ts">
<<<<<<< HEAD
	let phoneNumber = '821030637950';
	let templateCode = 'testcode01';
	let text =
		'[#{SHOPNAME}], 안녕하세요. #{NAME}님! #{SHOPNAME}에 회원가입 해주셔서 진심으로 감사드립니다!';
=======
	import { onMount } from 'svelte';
	
	// Template data
	let availableTemplates: any[] = [];
	let selectedTemplate: any = null;
	let templatesLoading = true;
	let templatesError: string | null = null;
	
	// Form data
	let phoneNumber = '';
	let templateCode = '';
	let text = '';
>>>>>>> 508023e (Add test kakao alimtalk success)
	let templateData = '{\n  "SHOPNAME": "매치트립",\n  "NAME": "홍길동"\n}';
	let includeButton = false;
	let loading = false;
	let result: any = null;
	let error: string | null = null;
	let requestBody: any = null;
	let logs: any = null;
	let loadingLogs = false;
	let logsError: string | null = null;
	let reports: any = null;
	let loadingReports = false;
	let reportsError: string | null = null;
<<<<<<< HEAD
	let diagnostics: any = null;
	let loadingDiagnostics = false;
	
	// Computed preview of substituted text
	$: substitutedText = (() => {
		try {
			if (!templateData) return text;
			const data = JSON.parse(templateData);
			let result = text;
			for (const [key, value] of Object.entries(data)) {
				result = result.replace(new RegExp(`#\\{${key}\\}`, 'g'), String(value));
			}
			return result;
		} catch {
			return text;
		}
	})();
=======
	
	// Load templates on mount
	onMount(async () => {
		try {
			const response = await fetch('/api/test-kakao-templates');
			const data = await response.json();
			
			if (data.success) {
				availableTemplates = data.templates;
				if (availableTemplates.length > 0) {
					selectedTemplate = availableTemplates[0];
					templateCode = selectedTemplate.code;
					text = selectedTemplate.text;
					includeButton = !!selectedTemplate.button;
					updateDefaultTemplateData();
				}
			} else {
				templatesError = data.error || 'Failed to load templates';
			}
		} catch (err) {
			templatesError = 'Failed to load templates';
		} finally {
			templatesLoading = false;
		}
	});
	
	// Generate default template data based on selected template
	function updateDefaultTemplateData() {
		if (!selectedTemplate) return;
		
		const defaultData: Record<string, string> = {};
		for (const variable of selectedTemplate.variables) {
			// Set default values based on common variables
			if (variable === 'SHOPNAME') {
				defaultData[variable] = '매치트립';
			} else if (variable === 'NAME' || variable === '가이드' || variable === '고객') {
				defaultData[variable] = '홍길동';
			} else if (variable === '여행총결제금액') {
				defaultData[variable] = '100,000원';
			} else {
				defaultData[variable] = `[${variable}]`;
			}
		}
		templateData = JSON.stringify(defaultData, null, 2);
	}
	
	// Update form when template selection changes
	function onTemplateChange() {
		const template = availableTemplates.find(t => t.code === templateCode);
		if (template) {
			selectedTemplate = template;
			text = template.text;
			includeButton = !!template.button;
			updateDefaultTemplateData();
		}
	}
>>>>>>> 508023e (Add test kakao alimtalk success)

	async function sendTestKakao() {
		loading = true;
		error = null;
		result = null;

		try {
			let parsedTemplateData;
			try {
				parsedTemplateData = templateData ? JSON.parse(templateData) : undefined;
			} catch (e) {
				error = 'Invalid JSON in template data';
				loading = false;
				return;
			}

			// Create buttons array if includeButton is true and template has button
			const buttons = includeButton && selectedTemplate?.button
				? [
						{
							type: selectedTemplate.button.type,
							name: selectedTemplate.button.name,
							urlMobile: selectedTemplate.button.urlMobile,
							urlPc: selectedTemplate.button.urlPc
						}
					]
				: undefined;

			// Show what we send to our API
			const apiRequestBody = {
				to: phoneNumber,
				templateCode: templateCode,
				text: text,
				templateData: parsedTemplateData,
				...(buttons ? { buttons } : {})
			};

			// Process template variables for display
			let processedText = text;
			if (parsedTemplateData) {
				for (const [key, value] of Object.entries(parsedTemplateData)) {
					const placeholder = `#{${key}}`;
					processedText = processedText.replace(new RegExp(placeholder, 'g'), String(value));
				}
			}

			// Show what actually gets sent to Infobip
			// Note: The text field will contain the substituted text, NOT the template
			let substitutedTextForRequest = text;
			if (parsedTemplateData) {
				for (const [key, value] of Object.entries(parsedTemplateData)) {
					substitutedTextForRequest = substitutedTextForRequest.replace(
						new RegExp(`#\\{${key}\\}`, 'g'), 
						String(value)
					);
				}
			}
			
			requestBody = {
				messages: [
					{
						sender: 'KAKAO_CHANNEL_PROFILE_KEY (from env)',
						destinations: [
							{
								to: phoneNumber
							}
						],
						content: {
							templateCode: templateCode,
<<<<<<< HEAD
							text: substitutedTextForRequest,
							type: 'TEMPLATE'
							// Note: templateData is NOT sent to Infobip
=======
							text: processedText,
							type: 'TEMPLATE',
							...(buttons ? { buttons } : {})
>>>>>>> 508023e (Add test kakao alimtalk success)
						}
					}
				]
			};

			const response = await fetch('/api/test-kakao', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(apiRequestBody)
			});

			const data = await response.json();

			if (response.ok) {
				result = data;
			} else {
				error = data.error || 'Failed to send Kakao AlimTalk';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
		} finally {
			loading = false;
		}
	}

	async function fetchLogs() {
		loadingLogs = true;
		logsError = null;
		logs = null;

		try {
			// Get the message ID from the result if available
			const messageId = result?.result?.messages?.[0]?.to;
			const bulkId = result?.result?.bulkId;

			// Calculate time range (last 5 minutes to now + 1 minute)
			const now = new Date();
			const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
			const oneMinuteLater = new Date(now.getTime() + 60 * 1000);

			const response = await fetch('/api/test-kakao-logs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messageId,
					bulkId,
					sentSince: fiveMinutesAgo.toISOString(),
					sentUntil: oneMinuteLater.toISOString(),
					limit: 10
				})
			});

			const data = await response.json();

			if (response.ok) {
				logs = data.result;
			} else {
				logsError = data.error || 'Failed to fetch logs';
			}
		} catch (err) {
			logsError = err instanceof Error ? err.message : 'Network error';
		} finally {
			loadingLogs = false;
		}
	}

	async function runDiagnostics() {
		loadingDiagnostics = true;
		diagnostics = null;
		
		try {
			const response = await fetch('/api/test-kakao-diagnostic');
			diagnostics = await response.json();
		} catch (err) {
			diagnostics = { error: err instanceof Error ? err.message : 'Diagnostic failed' };
		} finally {
			loadingDiagnostics = false;
		}
	}
	
	async function testSimpleTemplate() {
		// Test with a simple template without variables
		loading = true;
		error = null;
		result = null;
		
		try {
			const simpleRequest = {
				to: phoneNumber,
				templateCode: templateCode,
				text: '안녕하세요. 회원가입을 환영합니다!',
				templateData: {}
			};
			
			const response = await fetch('/api/test-kakao', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(simpleRequest)
			});
			
			const data = await response.json();
			
			if (response.ok) {
				result = data;
			} else {
				error = data.error || 'Failed to send simple template';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
		} finally {
			loading = false;
		}
	}

	async function fetchDeliveryReports() {
		loadingReports = true;
		reportsError = null;
		reports = null;

		try {
			// Get the message ID and bulk ID from the result if available
			const messageId = result?.result?.messages?.[0]?.messageId;
			const bulkId = result?.result?.bulkId;

			const response = await fetch('/api/test-kakao-reports', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messageId,
					bulkId,
					limit: 10
				})
			});

			const data = await response.json();

			if (response.ok) {
				reports = data.result;
			} else {
				reportsError = data.error || 'Failed to fetch delivery reports';
			}
		} catch (err) {
			reportsError = err instanceof Error ? err.message : 'Network error';
		} finally {
			loadingReports = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 p-4">
	<div class="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
		<h1 class="mb-6 text-2xl font-bold">Kakao AlimTalk Test</h1>

		<div class="space-y-4">
			<div>
				<label for="phone" class="mb-1 block text-sm font-medium text-gray-700">
					Phone Number
				</label>
				<input
					id="phone"
					type="tel"
					bind:value={phoneNumber}
					placeholder="821012345678"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
				/>
				<p class="mt-1 text-xs text-gray-500">
					Phone number in international format without + sign. For Korea: 82 + phone number without
					leading 0 (e.g., 821012345678)
				</p>
			</div>


			<div>
				<label for="templateCode" class="mb-1 block text-sm font-medium text-gray-700">
					Template
				</label>
				{#if templatesLoading}
					<div class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500">
						Loading templates...
					</div>
				{:else if templatesError}
					<div class="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-600">
						{templatesError}
					</div>
				{:else}
					<select
						id="templateCode"
						bind:value={templateCode}
						onchange={onTemplateChange}
						class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
					>
						{#each availableTemplates as template}
							<option value={template.code}>
								{template.code} - {template.name} ({template.description})
							</option>
						{/each}
					</select>
					{#if selectedTemplate}
						<p class="mt-1 text-xs text-gray-500">
							Select from pre-approved Kakao templates. Variables: {selectedTemplate.variables.join(', ')}
						</p>
					{/if}
				{/if}
			</div>

			<div>
				<label for="text" class="mb-1 block text-sm font-medium text-gray-700">
					Template Text (Read-only)
				</label>
				<textarea
					id="text"
					value={text}
					rows="3"
					readonly
					class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600"
				></textarea>
				<p class="mt-1 text-xs text-gray-500">This is the registered template text. Variables will be replaced with values from Template Data.</p>
			</div>

			<div>
				<label for="templateData" class="mb-1 block text-sm font-medium text-gray-700">
					Template Data (JSON) - Optional
				</label>
				<textarea
					id="templateData"
					bind:value={templateData}
					rows="4"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
				></textarea>
				<p class="mt-1 text-xs text-gray-500">Variables for template substitution in JSON format</p>
			</div>
			
			<div class="rounded-md border border-blue-200 bg-blue-50 p-4">
				<p class="mb-2 text-sm font-medium text-blue-700">Preview (After Variable Substitution):</p>
				<p class="text-sm text-gray-800 whitespace-pre-wrap">{substitutedText}</p>
			</div>

<<<<<<< HEAD
			<div class="flex gap-2">
				<button
					onclick={sendTestKakao}
					disabled={loading || !phoneNumber || !templateCode || !text}
					class="bg-primary flex-1 rounded-md px-4 py-2 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					{loading ? 'Sending...' : 'Send Test AlimTalk'}
				</button>
				
				<button
					onclick={runDiagnostics}
					disabled={loadingDiagnostics}
					class="bg-purple-600 rounded-md px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					{loadingDiagnostics ? '...' : '🔍 Diagnostics'}
				</button>
			</div>
			
=======
			{#if selectedTemplate?.button}
				<div class="flex items-center space-x-2">
					<input
						id="includeButton"
						type="checkbox"
						bind:checked={includeButton}
						class="h-4 w-4 text-primary rounded border-gray-300 focus:ring-color-primary"
					/>
					<label for="includeButton" class="text-sm font-medium text-gray-700">
						Include Button ({selectedTemplate.button.name})
					</label>
				</div>
				{#if includeButton}
					<div class="ml-6 rounded-md border border-blue-200 bg-blue-50 p-3">
						<p class="text-xs font-medium text-blue-900">Button Details:</p>
						<p class="text-xs text-blue-700">Type: {selectedTemplate.button.type}</p>
						<p class="text-xs text-blue-700">Name: {selectedTemplate.button.name}</p>
						<p class="text-xs text-blue-700">URL: {selectedTemplate.button.urlMobile}</p>
					</div>
				{/if}
			{:else if selectedTemplate}
				<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
					<p class="text-xs text-gray-600">This template does not have a button configured.</p>
				</div>
			{/if}

>>>>>>> 508023e (Add test kakao alimtalk success)
			<button
				onclick={testSimpleTemplate}
				disabled={loading || !phoneNumber || !templateCode}
				class="w-full rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
			>
				{loading ? 'Testing...' : 'Test Simple Template (No Variables)'}
			</button>
		</div>

		{#if requestBody}
			<div class="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
				<p class="mb-2 text-sm font-medium text-gray-700">Actual Infobip API Request Body:</p>
				<pre class="overflow-x-auto rounded bg-gray-100 p-2 text-xs">{JSON.stringify(requestBody, null, 2)}</pre>
<<<<<<< HEAD
				<p class="mt-2 text-xs text-gray-600">Note: The sender field will be replaced with the actual KAKAO_CHANNEL_PROFILE_KEY value from environment variables on the server.</p>
				<p class="mt-1 text-xs text-gray-600 font-semibold">Important: The text field shows the SUBSTITUTED text that will be sent to Infobip. Template variables are replaced BEFORE sending.</p>
=======
				<p class="mt-2 text-xs text-gray-600">Note: The sender field will be replaced with the actual KAKAO_CHANNEL_PROFILE_KEY value from environment variables on the server. Template variables (#{NAME}, #{SHOPNAME}) are replaced with actual values before sending.</p>
>>>>>>> 508023e (Add test kakao alimtalk success)
			</div>
		{/if}

		{#if error}
			<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
				<p class="text-sm text-red-700">Error: {error}</p>
			</div>
		{/if}
		
		{#if diagnostics}
			<div class="mt-4 rounded-md border border-purple-200 bg-purple-50 p-4">
				<p class="mb-2 text-sm font-medium text-purple-700">Diagnostics Results:</p>
				<pre class="overflow-x-auto rounded bg-purple-100 p-2 text-xs">{JSON.stringify(diagnostics, null, 2)}</pre>
				
				{#if diagnostics.suggestions}
					<div class="mt-3 rounded border border-purple-300 bg-white p-3">
						<p class="mb-2 text-xs font-medium text-purple-700">Troubleshooting Steps:</p>
						<ul class="space-y-1 text-xs text-gray-700">
							{#each diagnostics.suggestions as suggestion}
								<li>• {suggestion}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}

		{#if result}
			<div class="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
				<p class="mb-2 text-sm font-medium text-green-700">AlimTalk sent successfully!</p>
				<pre class="overflow-x-auto text-xs">{JSON.stringify(result, null, 2)}</pre>

				{#if result.result?.messages?.[0]}
					<div class="mt-3 rounded border border-green-300 bg-white p-3">
						<p class="mb-1 text-xs font-medium text-gray-700">Message Details:</p>
						<p class="text-xs text-gray-600">Message ID: {result.result.messages[0].to}</p>
						<p class="text-xs text-gray-600">
							Status: {result.result.messages[0].status?.name || 'PENDING'}
						</p>
						{#if result.result.messages[0].status?.description}
							<p class="text-xs text-gray-600">
								Description: {result.result.messages[0].status.description}
							</p>
						{/if}
					</div>
				{/if}
			</div>
			
			<div class="mt-3 flex gap-2">
				<button
					onclick={fetchLogs}
					disabled={loadingLogs}
					class="flex-1 rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					{loadingLogs ? 'Fetching...' : 'Fetch Logs'}
				</button>
				<button
					onclick={fetchDeliveryReports}
					disabled={loadingReports}
					class="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					{loadingReports ? 'Fetching...' : 'Fetch Reports'}
				</button>
			</div>
		{/if}

		{#if logsError}
			<div class="mt-4 rounded-md border border-orange-200 bg-orange-50 p-4">
				<p class="text-sm text-orange-700">Logs Error: {logsError}</p>
			</div>
		{/if}

		{#if logs}
			<div class="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
				<p class="mb-2 text-sm font-medium text-blue-700">Message Logs:</p>
				<pre class="overflow-x-auto rounded bg-blue-100 p-2 text-xs">{JSON.stringify(logs, null, 2)}</pre>
				
				{#if logs.results && logs.results.length > 0}
					<div class="mt-3 space-y-2">
						<p class="text-xs font-medium text-blue-700">Log Details:</p>
						{#each logs.results as log}
							<div class="rounded border border-blue-300 bg-white p-3 text-xs">
								<p><strong>Message ID:</strong> {log.messageId}</p>
								<p><strong>To:</strong> {log.to}</p>
								<p><strong>Status:</strong> {log.status?.name || 'Unknown'}</p>
								{#if log.status?.description}
									<p><strong>Description:</strong> {log.status.description}</p>
								{/if}
								<p><strong>Sent At:</strong> {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}</p>
								{#if log.doneAt}
									<p><strong>Done At:</strong> {new Date(log.doneAt).toLocaleString()}</p>
								{/if}
								{#if log.price}
									<p><strong>Price:</strong> {log.price.pricePerMessage} {log.price.currency}</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-2 text-xs text-blue-600">No logs found for the specified time range.</p>
				{/if}
			</div>
		{/if}

		{#if reportsError}
			<div class="mt-4 rounded-md border border-purple-200 bg-purple-50 p-4">
				<p class="text-sm text-purple-700">Reports Error: {reportsError}</p>
			</div>
		{/if}

		{#if reports}
			<div class="mt-4 rounded-md border border-indigo-200 bg-indigo-50 p-4">
				<p class="mb-2 text-sm font-medium text-indigo-700">Delivery Reports:</p>
				<pre class="overflow-x-auto rounded bg-indigo-100 p-2 text-xs">{JSON.stringify(reports, null, 2)}</pre>
				
				{#if reports.results && reports.results.length > 0}
					<div class="mt-3 space-y-2">
						<p class="text-xs font-medium text-indigo-700">Report Details:</p>
						{#each reports.results as report}
							<div class="rounded border border-indigo-300 bg-white p-3 text-xs">
								<p><strong>Bulk ID:</strong> {report.bulkId || 'N/A'}</p>
								<p><strong>Message ID:</strong> {report.messageId}</p>
								<p><strong>To:</strong> {report.to}</p>
								<p><strong>Status:</strong> 
									<span class="{report.status?.name === 'DELIVERED' ? 'text-green-600' : report.status?.name === 'PENDING' ? 'text-yellow-600' : 'text-red-600'}">
										{report.status?.name || 'Unknown'}
									</span>
								</p>
								{#if report.status?.description}
									<p><strong>Description:</strong> {report.status.description}</p>
								{/if}
								{#if report.status?.groupName}
									<p><strong>Group:</strong> {report.status.groupName}</p>
								{/if}
								<p><strong>Sent At:</strong> {report.sentAt ? new Date(report.sentAt).toLocaleString() : 'N/A'}</p>
								{#if report.doneAt}
									<p><strong>Done At:</strong> {new Date(report.doneAt).toLocaleString()}</p>
								{/if}
								{#if report.error}
									<p class="text-red-600"><strong>Error:</strong> {JSON.stringify(report.error)}</p>
								{/if}
								{#if report.price}
									<p><strong>Price:</strong> {report.price.pricePerMessage} {report.price.currency}</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-2 text-xs text-indigo-600">No delivery reports found.</p>
				{/if}
			</div>
		{/if}
	</div>

	<div class="mx-auto mt-6 max-w-md rounded-lg bg-blue-50 p-4">
		<h2 class="mb-2 font-semibold text-blue-900">Required Environment Variables:</h2>
		<ul class="space-y-1 text-sm text-blue-800">
			<li>• INFOBIP_API_KEY (required)</li>
			<li>• INFOBIP_BASE_URL (required)</li>
			<li>• KAKAO_CHANNEL_PROFILE_KEY (required)</li>
		</ul>
		<p class="mt-3 text-xs text-blue-700">
			Note: You need to register your KakaoTalk official account with Infobip and get templates
			approved before sending AlimTalk messages. The KAKAO_CHANNEL_PROFILE_KEY should be set in
			your environment variables.
		</p>
	</div>

	<div class="mx-auto mt-4 max-w-md rounded-lg bg-yellow-50 p-4">
		<h2 class="mb-2 font-semibold text-yellow-900">Template Usage:</h2>
		<p class="mb-2 text-sm text-yellow-800">
			AlimTalk requires pre-approved templates. Each template has:
		</p>
		<ul class="space-y-1 text-sm text-yellow-800">
			<li>• Template ID: Unique identifier</li>
			<li>• Variables: Placeholders for dynamic content</li>
			<li>• Fixed format: Cannot be modified</li>
		</ul>
		<p class="mt-3 text-xs text-yellow-700">
			Example template data for welcome message (Template ID: 1):
		</p>
		<pre class="mt-1 overflow-x-auto rounded bg-yellow-100 p-2 text-xs">{`{
  "SHOPNAME": "매치트립",
  "NAME": "김철수"
}`}</pre>
		<p class="mt-2 text-xs text-yellow-700">
			This will generate: "[매치트립], 안녕하세요. 김철수님! 매치트립에 회원가입 해주셔서 진심으로
			감사드립니다!"
		</p>
	</div>
</div>
