<script lang="ts">
	import { api } from '$lib/api.js';
	import { toastState } from '$lib/stores/toast.svelte.js';
	import { authState } from '$lib/stores/auth.svelte.js';

	let data = $state([]);
	let totalItems = $state(0);
	let totalPages = $state(0);
	let page = $state(1);
	let limit = $state(10);
	let search = $state('');
	let loading = $state(false);
	let showModal = $state(false);
	let editItem = $state(null);

	let form = $state({
		id_tahun_ajaran: '',
		nama_tahun_ajaran: '',
		semester: '',
		is_aktif: false
	});

	let debounceTimer;

	async function fetchData() {
		loading = true;
		try {
			const res = await api.get('/tahun-ajaran', { params: { page, limit, search } });
			data = res.data;
			totalItems = res.metadata.total_items;
			totalPages = res.metadata.total_pages;
		} catch (err) {
			toastState.error(err.message || 'Gagal memuat data');
		} finally {
			loading = false;
		}
	}

	function onSearchInput(e) {
		search = e.target.value;
		page = 1;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(fetchData, 300);
	}

	function goToPage(p) {
		if (p < 1 || p > totalPages) return;
		page = p;
		fetchData();
	}

	function openAdd() {
		editItem = null;
		form = { id_tahun_ajaran: '', nama_tahun_ajaran: '', semester: '', is_aktif: false };
		showModal = true;
	}

	function openEdit(item) {
		editItem = { ...item };
		form = {
			id_tahun_ajaran: item.id_tahun_ajaran,
			nama_tahun_ajaran: item.nama_tahun_ajaran || '',
			semester: item.semester || '',
			is_aktif: item.is_aktif
		};
		showModal = true;
	}

	async function handleSave() {
		try {
			const payload = {
				id_sekolah: authState.id_sekolah,
				nama_tahun_ajaran: form.nama_tahun_ajaran,
				semester: form.semester,
				is_aktif: form.is_aktif
			};
			if (editItem) {
				await api.put(`/tahun-ajaran/${editItem.id_tahun_ajaran}`, payload);
				toastState.success('Tahun ajaran berhasil diperbarui');
			} else {
				await api.post('/tahun-ajaran', { ...payload, id_tahun_ajaran: form.id_tahun_ajaran });
				toastState.success('Tahun ajaran berhasil ditambahkan');
			}
			showModal = false;
			fetchData();
		} catch (err) {
			toastState.error(err.message || 'Gagal menyimpan tahun ajaran');
		}
	}

	async function handleDelete(id) {
		if (!confirm('Hapus tahun ajaran ini?')) return;
		try {
			await api.delete(`/tahun-ajaran/${id}`);
			toastState.success('Tahun ajaran berhasil dihapus');
			fetchData();
		} catch (err) {
			toastState.error(err.message || 'Gagal menghapus tahun ajaran');
		}
	}

	async function toggleAktif(item) {
		try {
			await api.put(`/tahun-ajaran/${item.id_tahun_ajaran}`, {
				id_sekolah: item.id_sekolah,
				nama_tahun_ajaran: item.nama_tahun_ajaran,
				semester: item.semester,
				is_aktif: true
			});
			toastState.success('Tahun ajaran diaktifkan');
			fetchData();
		} catch (err) {
			toastState.error(err.message || 'Gagal mengaktifkan tahun ajaran');
		}
	}

	$effect(() => { fetchData(); });
</script>

<div class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-xl font-bold text-slate-800">Tahun Ajaran</h1>
		<button onclick={openAdd} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			Tambah Tahun Ajaran
		</button>
	</div>

	<div class="bg-white rounded-xl shadow-sm border border-slate-200">
		<div class="p-4 border-b border-slate-200 flex items-center gap-4">
			<div class="relative flex-1 max-w-sm">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
				<input type="text" value={search} oninput={onSearchInput} placeholder="Cari tahun ajaran..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
			</div>
			<select bind:value={limit} onchange={() => { page = 1; fetchData(); }} class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
				<option value={10}>10</option>
				<option value={25}>25</option>
				<option value={50}>50</option>
			</select>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-50 text-slate-600 text-xs uppercase">
					<tr>
						<th class="text-left px-4 py-3 font-medium">ID Tahun Ajaran</th>
						<th class="text-left px-4 py-3 font-medium">Nama</th>
						<th class="text-left px-4 py-3 font-medium">Semester</th>
						<th class="text-left px-4 py-3 font-medium">Sekolah</th>
						<th class="text-center px-4 py-3 font-medium">Aktif</th>
						<th class="text-center px-4 py-3 font-medium">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Memuat data...</td></tr>
					{:else if data.length === 0}
						<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Tidak ada data</td></tr>
					{:else}
						{#each data as item (item.id_tahun_ajaran)}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-3 font-mono text-xs text-slate-500">{item.id_tahun_ajaran}</td>
								<td class="px-4 py-3 text-slate-700">{item.nama_tahun_ajaran || '-'}</td>
								<td class="px-4 py-3 text-slate-700">{item.semester || '-'}</td>
								<td class="px-4 py-3 text-slate-700">{item.id_sekolah}</td>
								<td class="px-4 py-3 text-center">
									{#if item.is_aktif}
										<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Aktif</span>
									{:else}
										<button onclick={() => toggleAktif(item)} class="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-700">Aktifkan</button>
									{/if}
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center justify-center gap-2">
										<button onclick={() => openEdit(item)} class="p-1.5 rounded text-blue-600 hover:bg-blue-50" title="Edit">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
										</button>
										<button onclick={() => handleDelete(item.id_tahun_ajaran)} class="p-1.5 rounded text-red-600 hover:bg-red-50" title="Hapus">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<div class="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
			<span>{totalItems > 0 ? `Menampilkan ${(page - 1) * limit + 1}-${Math.min(page * limit, totalItems)} dari ${totalItems} Tahun Ajaran` : 'Tidak ada data'}</span>
			<div class="flex items-center gap-1">
				<button onclick={() => goToPage(page - 1)} disabled={page <= 1} class="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50 text-sm font-medium">Prev</button>
				{#each Array.from({ length: Math.min(totalPages, 5) }, (_, i) => Math.max(1, Math.min(page - 2, totalPages - 4)) + i) as p}
					<button onclick={() => goToPage(p)} class="w-8 h-8 rounded text-sm font-medium {p === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">{p}</button>
				{/each}
				<button onclick={() => goToPage(page + 1)} disabled={page >= totalPages} class="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50 text-sm font-medium">Next</button>
			</div>
		</div>
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onclick={() => showModal = false} role="presentation" tabindex="-1">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
			<div class="px-6 py-4 border-b border-slate-200">
				<h2 class="text-lg font-semibold text-slate-800">{editItem ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}</h2>
			</div>
			<div class="px-6 py-4 space-y-4">
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">ID Tahun Ajaran</label>
					<input type="text" bind:value={form.id_tahun_ajaran} disabled={!!editItem} placeholder="TA-2627" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100" />
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">Nama Tahun Ajaran</label>
					<input type="text" bind:value={form.nama_tahun_ajaran} placeholder="2026/2027" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">Semester</label>
					<input type="text" bind:value={form.semester} placeholder="Ganjil" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div class="flex items-center gap-2">
					<input type="checkbox" bind:checked={form.is_aktif} id="is_aktif" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
					<label for="is_aktif" class="text-sm text-slate-700">Set sebagai tahun ajaran aktif</label>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
				<button onclick={() => showModal = false} class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
				<button onclick={handleSave} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Simpan</button>
			</div>
		</div>
	</div>
{/if}
