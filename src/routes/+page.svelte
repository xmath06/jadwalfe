<script lang="ts">
	import { redirect } from '@sveltejs/kit';
	import { authState } from '$lib/stores/auth.svelte.js';

	if (!authState.isAuthenticated) {
		redirect(307, '/login');
	} else {
		redirect(307, '/dashboard');
	}
</script>
