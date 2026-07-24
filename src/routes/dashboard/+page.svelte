<script lang="ts">
	import { authState } from '$lib/stores/auth.svelte.js';
</script>

<div class="p-6">
	<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
		<h2 class="text-lg font-semibold text-slate-700 mb-4">Selamat Datang</h2>
		<p class="text-slate-600">Role: <span class="font-medium">{authState.role}</span></p>
		<p class="text-slate-600">Sekolah: <span class="font-medium">{authState.id_sekolah}</span></p>
	</div>
</div>
