<script lang="ts">
	import { api } from '$lib/api.js';
	import { authState } from '$lib/stores/auth.svelte.js';
	import { toastState } from '$lib/stores/toast.svelte.js';

	let status = $state('IDLE');
	let currentGeneration = $state(0);
	let maxGenerations = $state(500);
	let bestFitness = $state(null);
	let statusMessage = $state('');
	let startedAt = $state('');
	let completedAt = $state('');
	let loading = $state(false);
	let pollingInterval = $state(null);

	let progressPercent = $derived(
		maxGenerations > 0 ? Math.round((currentGeneration / maxGenerations) * 100) : 0
	);

	function fitnessPercent(fitness) {
		if (fitness === null) return 0;
		const clamped = Math.min(0, fitness);
		return Math.round((1 - clamped / 1000) * 100);
	}

	function fitnessColor(fitness) {
		if (fitness === null) return 'bg-slate-300';
		if (fitness >= 0) return 'bg-green-500';
		if (fitness > -200) return 'bg-yellow-500';
		if (fitness > -500) return 'bg-orange-500';
		return 'bg-red-500';
	}

	async function startGeneration() {
		if (loading) return;
		loading = true;

		try {
			const res = await api.post('/schedule/generate', {
				id_sekolah: authState.id_sekolah || '1',
				id_tahun_ajaran: 'TA-2627'
			});

			if (res.status === 'PROCESSING') {
				toastState.info('Proses penjadwalan dimulai...');
				status = 'RUNNING';
				currentGeneration = 0;
				bestFitness = null;
				statusMessage = '';
				startedAt = new Date().toISOString();
				completedAt = '';
				startPolling();
			}
		} catch (err) {
			toastState.error(err.message || 'Gagal memulai penjadwalan');
		} finally {
			loading = false;
		}
	}

	function startPolling() {
		stopPolling();
		pollingInterval = setInterval(pollStatus, 2000);
	}

	function stopPolling() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	}

	async function pollStatus() {
		try {
			const res = await api.get('/schedule/generate/status', {
				params: {
					id_sekolah: authState.id_sekolah || '1',
					id_tahun_ajaran: 'TA-2627'
				}
			});

			status = res.status || 'IDLE';
			currentGeneration = res.currentGeneration || 0;
			maxGenerations = res.maxGenerations || 500;
			bestFitness = res.bestFitness;
			statusMessage = res.message || '';
			if (res.startedAt) startedAt = res.startedAt;
			if (res.completedAt) completedAt = res.completedAt;

			if (status === 'COMPLETED') {
				stopPolling();
				toastState.success(res.message || 'Penjadwalan selesai!');
			} else if (status === 'FAILED') {
				stopPolling();
				toastState.error(res.message || 'Penjadwalan gagal');
			}
		} catch (err) {
			if (status === 'RUNNING') {
				stopPolling();
				status = 'IDLE';
				toastState.error('Koneksi terputus saat memantau status');
			}
		}
	}

	$effect(() => {
		return () => stopPolling();
	});

	function formatDate(iso) {
		if (!iso) return '-';
		return new Date(iso).toLocaleString('id-ID');
	}

	const isRunning = $derived(status === 'RUNNING' || status === 'PROCESSING');
</script>

<div class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-xl font-bold text-slate-800">Pemicuan Jadwal Otomatis</h1>
	</div>

	<div class="grid gap-6 max-w-2xl">
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
			<h2 class="text-lg font-semibold text-slate-800 mb-2">Algoritma Genetika</h2>
			<p class="text-sm text-slate-500 mb-6">Sistem akan menyusun jadwal pelajaran secara otomatis menggunakan algoritma genetika dengan populasi 100 kromosom dan maksimal 500 generasi.</p>

			<button
				onclick={startGeneration}
				disabled={isRunning || loading}
				class="w-full py-3 px-6 rounded-lg text-sm font-semibold text-white transition-colors {isRunning || loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}"
			>
				{loading ? 'Memulai...' : isRunning ? 'Sedang Berjalan...' : 'Mulai Pemicuan Otomatis'}
			</button>
		</div>

		{#if isRunning || status === 'COMPLETED' || status === 'FAILED'}
			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
				<h2 class="text-lg font-semibold text-slate-800">Status Progres</h2>

				<div class="flex items-center justify-between text-sm">
					<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium {status === 'COMPLETED' ? 'bg-green-100 text-green-700' : status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">
						<span class="w-1.5 h-1.5 rounded-full {status === 'RUNNING' ? 'bg-blue-500 animate-pulse' : ''}"></span>
						{status === 'RUNNING' ? 'SEDANG BERJALAN' : status === 'COMPLETED' ? 'SELESAI' : status === 'FAILED' ? 'GAGAL' : 'IDLE'}
					</span>
					<span class="text-slate-500">{formatDate(startedAt)}</span>
				</div>

				<div>
					<div class="flex justify-between text-sm text-slate-600 mb-1.5">
						<span>Generasi</span>
						<span class="font-semibold text-slate-800">{currentGeneration} / {maxGenerations}</span>
					</div>
					<div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
						<div
							class="h-full rounded-full transition-all duration-500 ease-out bg-blue-500"
							style="width: {progressPercent}%"
						></div>
					</div>
					<p class="text-xs text-slate-400 mt-1">{progressPercent}%</p>
				</div>

				<div>
					<div class="flex justify-between text-sm text-slate-600 mb-1.5">
						<span>Tingkat Kecocokan (Fitness)</span>
						<span class="font-semibold text-slate-800">{bestFitness !== null ? bestFitness : '-'}</span>
					</div>
					<div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
						<div
							class="h-full rounded-full transition-all duration-500 ease-out {fitnessColor(bestFitness)}"
							style="width: {fitnessPercent(bestFitness)}%"
						></div>
					</div>
					<p class="text-xs text-slate-400 mt-1">
						{#if bestFitness === null}
							Belum ada data
						{:else if bestFitness >= 0}
							Jadwal sempurna tanpa bentrok
						{:else if bestFitness > -200}
							Jadwal layak dengan sedikit pelanggaran
						{:else if bestFitness > -500}
							Masih terdapat beberapa bentrok
						{:else}
							Banyak bentrok, perlu optimasi ulang
						{/if}
					</p>
				</div>

				{#if statusMessage}
					<div class="p-3 rounded-lg text-sm {status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-200' : status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">
						{statusMessage}
					</div>
				{/if}

				{#if completedAt}
					<div class="text-xs text-slate-400">
						Selesai: {formatDate(completedAt)}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
