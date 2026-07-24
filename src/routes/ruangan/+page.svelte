<script lang="ts">
	import { api } from '$lib/api.js';
	import { toastState } from '$lib/stores/toast.svelte.js';
	import RuanganForm from '$lib/components/forms/RuanganForm.svelte';
	import * as XLSX from 'xlsx';

	let data = $state([]);
	let totalItems = $state(0);
	let totalPages = $state(0);
	let page = $state(1);
	let limit = $state(10);
	let search = $state('');
	let jenisRuangan = $state('');
	let loading = $state(false);
	let showModal = $state(false);
	let editItem = $state(null);

	let debounceTimer;

	async function fetchData() {
		loading = true;
		try {
			const params: any = { page, limit, search };
			if (jenisRuangan) params.jenis_ruangan = jenisRuangan;
			const res = await api.get('/ruangan', { params });
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
		showModal = true;
	}

	function openEdit(item) {
		editItem = { ...item };
		showModal = true;
	}

	async function handleSave(formData) {
		try {
			const payload = {
				id_sekolah: '1',
				...formData
			};
			if (editItem) {
				await api.put(`/ruangan/${editItem.id_ruangan}`, { ...payload, id_ruangan: undefined });
				toastState.success('Ruangan berhasil diperbarui');
			} else {
				payload.id_ruangan = `R-${String(Date.now()).slice(-4)}`;
				await api.post('/ruangan', payload);
				toastState.success('Ruangan berhasil ditambahkan');
			}
			showModal = false;
			fetchData();
		} catch (err) {
			toastState.error(err.message || 'Gagal menyimpan ruangan');
		}
	}

	async function handleDelete(id) {
		if (!confirm('Hapus ruangan ini?')) return;
		try {
			await api.delete(`/ruangan/${id}`);
			toastState.success('Ruangan berhasil dihapus');
			fetchData();
		} catch (err) {
			toastState.error(err.message || 'Gagal menghapus ruangan');
		}
	}

	function downloadTemplate() {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet([
			['nama_ruangan', 'jenis_ruangan'],
			['R-101', 'Teori']
		]);
		ws['!cols'] = [{ wch: 25 }, { wch: 14 }];
		XLSX.utils.book_append_sheet(wb, ws, 'Ruangan');
		XLSX.writeFile(wb, 'template_ruangan.xlsx');
	}

	function handleImport(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			toastState.error('File maksimal 5MB');
			return;
		}
		const reader = new FileReader();
		reader.onload = async (evt) => {
			try {
				const wb = XLSX.read(evt.target.result, { type: 'array' });
				const ws = wb.Sheets[wb.SheetNames[0]];
				const rows: any[] = XLSX.utils.sheet_to_json(ws);
				let success = 0, errors = [];
				for (let i = 0; i < rows.length; i++) {
					const row = rows[i];
					try {
						await api.post('/ruangan', {
							id_ruangan: `R-${String(Date.now()).slice(-4)}-${i}`,
							id_sekolah: '1',
							nama_ruangan: row.nama_ruangan,
							jenis_ruangan: row.jenis_ruangan || 'Teori'
						});
						success++;
					} catch (e) {
						errors.push(`Baris ${i + 2}: ${e.message}`);
					}
				}
				if (errors.length > 0) {
					toastState.warning(`${success} berhasil, ${errors.length} gagal: ${errors.slice(0, 3).join('; ')}`);
				} else {
					toastState.success(`${success} ruangan berhasil diimport`);
				}
				e.target.value = '';
				fetchData();
			} catch (err) {
				toastState.error('Gagal membaca file Excel');
				e.target.value = '';
			}
		};
		reader.readAsArrayBuffer(file);
	}

	$effect(() => { fetchData(); });

	function onFilterChange() {
		page = 1;
		fetchData();
	}
</script>

<div class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-xl font-bold text-slate-800">Data Ruangan</h1>
		<div class="flex items-center gap-2">
			<button onclick={downloadTemplate} class="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				Template
			</button>
			<label class="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
				Import
				<input type="file" accept=".xlsx,.xls" onchange={handleImport} class="hidden" />
			</label>
			<button onclick={openAdd} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
				Tambah Ruangan
			</button>
		</div>
	</div>

	<div class="bg-white rounded-xl shadow-sm border border-slate-200">
		<div class="p-4 border-b border-slate-200 flex items-center gap-4">
			<div class="relative flex-1 max-w-sm">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
				<input type="text" value={search} oninput={onSearchInput} placeholder="Cari ruangan..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
			</div>
			<select bind:value={jenisRuangan} onchange={onFilterChange} class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
				<option value="">Semua Tipe</option>
				<option value="Teori">Teori</option>
				<option value="Praktek">Praktek</option>
				<option value="Lapangan">Lapangan</option>
			</select>
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
						<th class="text-left px-4 py-3 font-medium">ID</th>
						<th class="text-left px-4 py-3 font-medium">Nama Ruangan</th>
						<th class="text-left px-4 py-3 font-medium">Tipe</th>
						<th class="text-center px-4 py-3 font-medium">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr><td colspan="4" class="px-4 py-8 text-center text-slate-500">Memuat data...</td></tr>
					{:else if data.length === 0}
						<tr><td colspan="4" class="px-4 py-8 text-center text-slate-500">Tidak ada data</td></tr>
					{:else}
						{#each data as item (item.id_ruangan)}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-3 font-mono text-xs text-slate-500">{item.id_ruangan}</td>
								<td class="px-4 py-3 font-medium text-slate-800">{item.nama_ruangan}</td>
								<td class="px-4 py-3">
									<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {item.jenis_ruangan === 'Teori' ? 'bg-blue-100 text-blue-700' : item.jenis_ruangan === 'Praktek' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}">{item.jenis_ruangan}</span>
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center justify-center gap-2">
										<button onclick={() => openEdit(item)} class="p-1.5 rounded text-blue-600 hover:bg-blue-50" title="Edit">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
										</button>
										<button onclick={() => handleDelete(item.id_ruangan)} class="p-1.5 rounded text-red-600 hover:bg-red-50" title="Hapus">
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
			<span>{totalItems > 0 ? `Menampilkan ${(page - 1) * limit + 1}-${Math.min(page * limit, totalItems)} dari ${totalItems} Ruangan` : 'Tidak ada data'}</span>
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onclick={() => showModal = false} onkeydown={(e) => e.key === 'Escape' && (showModal = false)} role="presentation">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onclick={(e) => e.stopPropagation()} onkeydown={() => {}} role="dialog" tabindex="-1">
			<div class="px-6 py-4 border-b border-slate-200">
				<h2 class="text-lg font-semibold text-slate-800">{editItem ? 'Edit Ruangan' : 'Tambah Ruangan'}</h2>
			</div>
			<div class="px-6 py-4">
				<RuanganForm data={editItem} onSave={handleSave} onCancel={() => showModal = false} />
			</div>
		</div>
	</div>
{/if}
