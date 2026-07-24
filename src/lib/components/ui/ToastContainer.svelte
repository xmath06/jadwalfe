<script lang="ts">
	import { toastState } from '$lib/stores/toast.svelte.js';

	const typeStyles = {
		success: 'bg-green-50 border-green-400 text-green-800',
		error: 'bg-red-50 border-red-400 text-red-800',
		warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
		info: 'bg-blue-50 border-blue-400 text-blue-800'
	};

	const typeIcons = {
		success: '✅',
		error: '❌',
		warning: '⚠️',
		info: 'ℹ️'
	};
</script>

{#if toastState.items.length > 0}
	<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
		{#each toastState.items as toast (toast.id)}
			<div
				class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 {typeStyles[toast.type]}"
				role="alert"
			>
				<span class="text-lg flex-shrink-0">{typeIcons[toast.type]}</span>
				<p class="text-sm font-medium flex-1 break-words">{toast.message}</p>
				<button
					onclick={() => toastState.remove(toast.id)}
					class="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
					aria-label="Tutup"
				>&times;</button>
			</div>
		{/each}
	</div>
{/if}
