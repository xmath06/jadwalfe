<script lang="ts">
	import { api } from '$lib/api.js';
	import { toastState } from '$lib/stores/toast.svelte.js';
	import { authState } from '$lib/stores/auth.svelte.js';

	let school = $state(null);
	let loading = $state(false);
	let showModal = $state(false);

	let form = $state({
		id_sekolah: authState.id_sekolah,
		nama_sekolah: '',
		jenjang: '',
		alamat: '',
		status: ''
	});

	async function fetchData() {
		loading = true;
		try {
			const res = await api.get('/sekolah', { params: { limit: 1 } });
			if (res.data && res.data.length > 0) {
				school = res.data[0];
			}
		} catch (err) {
			toastState.error(err.message || 'Gagal memuat data sekolah');
		} finally {
			loading = false;
		}
	}

	function openEdit() {
		if (!school) return;
		form = {
			id_sekolah: school.id_sekolah,
			nama_sekolah: school.nama_sekolah || '',
			jenjang: school.jenjang || '',
			alamat: school.alamat || '',
			status: school.status || ''
		};
		showModal = true;
	}

	async function handleSave() {
		try {
			await api.put(`/sekolah/${form.id_sekolah}`, {
				nama_sekolah: form.nama_sekolah,
				jenjang: form.jenjang,
				alamat: form.alamat,
				status: form.status
			});
			toastState.success('Sekolah berhasil diperbarui');
			showModal = false;
			fetchData();
		} catch (err) {
			toastState.error(err.message || 'Gagal menyimpan sekolah');
		}
	}

	$effect(() => { fetchData(); });
</script>

<div class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-xl font-bold text-slate-800">Profil Sekolah</h1>
	</div>

	<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
		{#if loading}
			<p class="text-slate-500 text-sm">Memuat data...</p>
		{:else if !school}
			<p class="text-slate-500 text-sm">Tidak ada data sekolah.</p>
		{:else}
			<dl class="space-y-3">
				<div>
					<dt class="text-xs uppercase text-slate-400">ID Sekolah</dt>
					<dd class="text-slate-800 font-mono text-sm">{school.id_sekolah}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase text-slate-400">Nama Sekolah</dt>
					<dd class="text-slate-800 font-medium">{school.nama_sekolah || '-'}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase text-slate-400">Jenjang</dt>
					<dd class="text-slate-800">{school.jenjang || '-'}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase text-slate-400">Alamat</dt>
					<dd class="text-slate-800">{school.alamat || '-'}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase text-slate-400">Status</dt>
					<dd class="text-slate-800">{school.status || '-'}</dd>
				</div>
			</dl>
			<button onclick={openEdit} class="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
				Edit Sekolah
			</button>
		{/if}
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onclick={() => showModal = false} role="presentation" tabindex="-1">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
			<div class="px-6 py-4 border-b border-slate-200">
				<h2 class="text-lg font-semibold text-slate-800">Edit Sekolah</h2>
			</div>
			<div class="px-6 py-4 space-y-4">
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label>
					<input type="text" bind:value={form.nama_sekolah} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">Jenjang</label>
					<input type="text" bind:value={form.jenjang} placeholder="SMA" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
					<textarea bind:value={form.alamat} rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
					<input type="text" bind:value={form.status} placeholder="Aktif" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
			</div>
			<div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
				<button onclick={() => showModal = false} class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
				<button onclick={handleSave} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Simpan</button>
			</div>
		</div>
	</div>
{/if}
