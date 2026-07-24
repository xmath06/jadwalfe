<script lang="ts">
	import { authState } from '$lib/stores/auth.svelte.js';
	import { api } from '$lib/api.js';
	import { goto } from '$app/navigation';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const res = await api.post('/auth/login', { id_sekolah: '1', username, password });
			authState.login(res.user, res.token);
			await goto('/dashboard');
		} catch (err: any) {
			error = err.message || 'Login gagal';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-100">
	<div class="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
		<h1 class="text-2xl font-bold text-slate-800 text-center mb-6">Penjadwalan SMA</h1>

		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label class="block text-sm font-medium text-slate-700 mb-1" for="username">Username</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-slate-700 mb-1" for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			{#if error}
				<p class="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-slate-400 transition-colors"
			>
				{loading ? 'Memproses...' : 'Masuk'}
			</button>
		</form>
	</div>
</div>
