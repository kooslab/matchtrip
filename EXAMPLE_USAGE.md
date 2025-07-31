# Example Usage of Travel Constants

## Import Constants and Formatters

```typescript
// Import constants directly
import { TRAVEL_STYLES, TRAVEL_METHODS, ACCOMMODATION_TYPES } from '$lib/constants/travel';

// Import formatter functions
import {
	formatTravelStyle,
	formatTravelMethod,
	formatActivities
} from '$lib/utils/travelFormatters';
```

## Using Constants in Components

### Example 1: Travel Style Selector

```svelte
<script lang="ts">
	import { TRAVEL_STYLE_OPTIONS } from '$lib/constants/travel';

	let selectedStyle = $state('');
</script>

<select bind:value={selectedStyle}>
	{#each TRAVEL_STYLE_OPTIONS as option}
		<option value={option.id}>{option.name}</option>
	{/each}
</select>
```

### Example 2: Display Formatted Values

```svelte
<script lang="ts">
	import { formatTravelStyle, formatTravelMethod } from '$lib/utils/travelFormatters';

	let trip = {
		travelStyle: 'friends',
		travelMethod: 'walking+driving'
	};
</script>

<p>Travel Style: {formatTravelStyle(trip.travelStyle)}</p>
<p>Travel Method: {formatTravelMethod(trip.travelMethod)}</p>
```

### Example 3: Activity Selection

```svelte
<script lang="ts">
	import { ACTIVITY_OPTIONS } from '$lib/constants/travel';

	let selectedActivities = $state<string[]>([]);
</script>

{#each ACTIVITY_OPTIONS as activity}
	<label>
		<input
			type="checkbox"
			value={activity.id}
			on:change={(e) => {
				if (e.target.checked) {
					selectedActivities = [...selectedActivities, activity.id];
				} else {
					selectedActivities = selectedActivities.filter((id) => id !== activity.id);
				}
			}}
		/>
		<span>{activity.icon} {activity.name}</span>
	</label>
{/each}
```

### Example 4: Status Badges

```svelte
<script lang="ts">
	import { formatOfferStatus, STATUS_BADGES } from '$lib/utils/travelFormatters';

	let offer = { status: 'pending' };
	let badge = STATUS_BADGES.offer[offer.status];
</script>

<span class="{badge.bg} {badge.text} rounded px-2 py-1">
	{formatOfferStatus(offer.status)}
</span>
```

## Benefits

1. **Single Source of Truth**: All labels are defined in one place
2. **Type Safety**: TypeScript ensures valid values
3. **Easy Maintenance**: Update labels in one location
4. **Consistency**: Same labels used everywhere
5. **Reusability**: Import and use anywhere in the codebase
