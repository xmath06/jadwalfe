<script lang="ts">
	import { api } from '$lib/api.js';
	import { toastState } from '$lib/stores/toast.svelte.js';
	import * as XLSX from 'xlsx';

	let kelasList = $state<any[]>([]);
	let guruList = $state<any[]>([]);
	let mapelList = $state<any[]>([]);
	let selectedKelas = $state('');
	let search = $state('');
	let page = $state(1);
	let limit = $state(50);
	let totalItems = $state(0);
	let totalPages = $state(0);
	let loading = $state(false);
	let savingRow = $state<string | null>(null);

	let selectedTingkat = $state('');
	let selectedJurusan = $state('');

	let teacherLoad = $state<any[]>([]);
	let showBeban = $state(false);

	let bebanTimer: ReturnType<typeof setTimeout>;

	const tingkatLabel: Record<string, string> = { TKT10: 'X', TKT11: 'XI', TKT12: 'XII' };
	const jurusanLabel: Record<string, string> = { 'FAS-E': '', MIPA: 'MIPA', IPS: 'IPS' };

	const kelompokColors: Record<string, string> = {
		'Wajib': 'bg-blue-50 border-l-blue-400',
		'Peminatan MIPA': 'bg-emerald-50 border-l-emerald-400',
		'Peminatan IPS': 'bg-orange-50 border-l-orange-400',
		'Pilihan': 'bg-purple-50 border-l-purple-400'
	};

	let debounceTimer: ReturnType<typeof setTimeout>;

	async function loadKelas() {
		try {
			const res = await api.get('/kelas', { params: { limit: 50 } });
			kelasList = res.data || [];
		} catch { /* ignore */ }
	}

	async function loadGuru() {
		try {
			const res = await api.get('/guru', { params: { limit: 100 } });
			guruList = res.data || [];
		} catch { /* ignore */ }
	}

	function getKelasLabel(k: any) {
		return `${tingkatLabel[k.id_tingkat] || k.id_tingkat} ${k.nama_sub_kelas}${jurusanLabel[k.id_jurusan] ? ' (' + jurusanLabel[k.id_jurusan] + ')' : ''}`;
	}

	async function onKelasChange() {
		search = '';
		page = 1;
		if (!selectedKelas) {
			mapelList = [];
			totalItems = 0;
			totalPages = 0;
			return;
		}
		const k = kelasList.find(c => c.id_kelas === selectedKelas);
		if (k) {
			selectedTingkat = k.id_tingkat;
			selectedJurusan = k.id_jurusan;
		}
		await fetchData();
	}

	async function fetchData() {
		if (!selectedKelas) return;
		loading = true;
		try {
			const res = await api.get('/kurikulum', { params: { id_kelas: selectedKelas, search, page, limit } });
			mapelList = res.data;
			totalItems = res.metadata.total_items;
			totalPages = res.metadata.total_pages;
		} catch (err: any) {
			toastState.error(err.message || 'Gagal memuat data');
		} finally {
			loading = false;
		}
	}

	function onSearchInput(e: Event) {
		search = (e.target as HTMLInputElement).value;
		page = 1;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(fetchData, 300);
	}

	async function saveAlokasi(item: any) {
		savingRow = item.id_mapel;
		try {
			await api.put('/kurikulum/alokasi', {
				id_sekolah: '1',
				id_tahun_ajaran: 'TA-2627',
				id_tingkat: selectedTingkat,
				id_jurusan: selectedJurusan,
				id_mapel: item.id_mapel,
				total_jam_seminggu: Number(item.total_jam_seminggu) || 0
			});
			toastState.success('JP tersimpan');
			debounceLoadBeban();
		} catch (err: any) {
			toastState.error(err.message || 'Gagal menyimpan JP');
		} finally {
			savingRow = null;
		}
	}

	async function savePlotting(item: any) {
		if (!item.id_guru_pilih) return;
		savingRow = item.id_mapel;
		try {
			await api.put('/kurikulum/plotting', {
				id_sekolah: '1',
				id_tahun_ajaran: 'TA-2627',
				id_kelas: selectedKelas,
				id_mapel: item.id_mapel,
				id_guru: item.id_guru_pilih
			});
			toastState.success('Guru tersimpan');
			debounceLoadBeban();
		} catch (err: any) {
			toastState.error(err.message || 'Gagal menyimpan guru');
		} finally {
			savingRow = null;
		}
	}

	function isSaving(id: string) { return savingRow === id; }

	function debounceLoadBeban() {
		clearTimeout(bebanTimer);
		bebanTimer = setTimeout(loadBeban, 500);
	}

	async function loadBeban() {
		try {
			const res = await api.get('/kurikulum/beban', { params: { id_tahun_ajaran: 'TA-2627' } });
			teacherLoad = (res.data || []).filter((t: any) => t.total_jp > 0);
		} catch { /* ignore */ }
	}

	function downloadTemplate() {
		const headers = ['id_mapel', 'id_kelas', 'id_tingkat', 'id_jurusan', 'total_jam_seminggu', 'id_guru'];
		const sampleRow = ['MAP-MTK', 'KLS-001', 'TKT10', 'FAS-E', 3, 'GUR-001'];
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
		ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 12 }];
		XLSX.utils.book_append_sheet(wb, ws, 'Kurikulum');
		XLSX.writeFile(wb, 'template_kurikulum.xlsx');
	}

	function handleImport(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			toastState.error('File maksimal 5MB');
			return;
		}
		const reader = new FileReader();
		reader.onload = async (evt) => {
			try {
				const wb = XLSX.read(evt.target!.result, { type: 'array' });
				const ws = wb.Sheets[wb.SheetNames[0]];
				const rows: any[] = XLSX.utils.sheet_to_json(ws);
				if (rows.length === 0) { toastState.warning('File kosong'); return; }
				const payload = rows.map((r: any) => ({
					id_tingkat: String(r.id_tingkat || selectedTingkat || 'TKT10'),
					id_jurusan: String(r.id_jurusan || selectedJurusan || 'FAS-E'),
					id_mapel: String(r.id_mapel),
					total_jam_seminggu: Number(r.total_jam_seminggu) || 0,
					id_kelas: String(r.id_kelas || selectedKelas || ''),
					id_guru: r.id_guru ? String(r.id_guru) : undefined
				}));
				const res = await api.post('/kurikulum/import', {
					id_sekolah: '1',
					id_tahun_ajaran: 'TA-2627',
					rows: payload
				});
				const { success, errors } = res.data;
				if (errors?.length) {
					toastState.warning(`${success} tersimpan, ${errors.length} gagal`);
				} else {
					toastState.success(`${success} baris berhasil diimport`);
				}
				(e.target as HTMLInputElement).value = '';
				await fetchData();
				await loadBeban();
			} catch (err: any) {
				toastState.error(err.message || 'Gagal membaca file');
				(e.target as HTMLInputElement).value = '';
			}
		};
		reader.readAsArrayBuffer(file);
	}

	let filteredGuru = $derived(guruList);

	function onGuruSearch(i: any, e: Event) {
		const v = (e.target as HTMLInputElement).value;
		const found = guruList.find(g => g.id_guru === v || g.nama_guru === v);
		if (found) {
			i.id_guru_pilih = found.id_guru;
		}
	}

	$effect(() => { loadKelas(); loadGuru(); });
</script>

<svelte:head>
	<title>Kurikulum</title>
</svelte:head>

<div class="p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-xl font-bold text-slate-800">Kurikulum & Plotting Guru</h1>
		<div class="flex items-center gap-2">
			<button onclick={() => showBeban = !showBeban} class="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
				Beban Guru
			</button>
			<button onclick={downloadTemplate} class="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				Template
			</button>
			<label class="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
				Import
				<input type="file" accept=".xlsx,.xls" onchange={handleImport} class="hidden" />
			</label>
		</div>
	</div>

	<!-- Panel Beban Guru -->
	{#if showBeban}
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
			<div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
				<h2 class="text-sm font-semibold text-slate-700">Beban Mengajar Guru</h2>
				<span class="text-xs text-slate-400">Total JP per minggu</span>
			</div>
			<div class="p-4">
				{#if teacherLoad.length === 0}
					<p class="text-sm text-slate-400 text-center py-4">Belum ada data plotting</p>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
						{#each teacherLoad as t}
							{@const pct = Math.min(Math.round((t.total_jp / 24) * 100), 100)}
							{@const color = t.total_jp > 30 ? 'red' : t.total_jp > 24 ? 'yellow' : 'green'}
							<div class="rounded-lg border p-3 {color === 'red' ? 'border-red-200 bg-red-50' : color === 'yellow' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}">
								<div class="text-sm font-medium text-slate-800 truncate">{t.nama_guru}</div>
								<div class="mt-1 flex items-end gap-2">
									<span class="text-lg font-bold {color === 'red' ? 'text-red-600' : color === 'yellow' ? 'text-yellow-600' : 'text-green-600'}">{t.total_jp}</span>
									<span class="text-xs text-slate-500 mb-1">/ 24 JP</span>
								</div>
								<div class="mt-2 w-full bg-slate-200 rounded-full h-1.5">
									<div class="h-1.5 rounded-full transition-all {color === 'red' ? 'bg-red-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}" style="width: {Math.min(pct, 100)}%"></div>
								</div>
								<div class="mt-1 text-xs text-slate-500">{t.jumlah_mapel} mapel</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Panel Utama -->
	<div class="bg-white rounded-xl shadow-sm border border-slate-200">
		<!-- Filter Bar -->
		<div class="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4">
			<div class="flex items-center gap-2">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="text-sm font-medium text-slate-600">Kelas:</label>
				<select bind:value={selectedKelas} onchange={onKelasChange} class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
					<option value="">-- Pilih Kelas --</option>
					{#each kelasList as k (k.id_kelas)}
						<option value={k.id_kelas}>{getKelasLabel(k)}</option>
					{/each}
				</select>
			</div>
			<div class="relative flex-1 max-w-sm">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
				<input type="text" value={search} oninput={onSearchInput} placeholder="Cari mapel..." disabled={!selectedKelas} class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400" />
			</div>
			<span class="text-xs text-slate-400">
				{selectedKelas ? `${totalItems} mapel` : 'Pilih kelas terlebih dahulu'}
			</span>
		</div>

		<!-- Tabel -->
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-50 text-slate-600 text-xs uppercase">
					<tr>
						<th class="text-left px-4 py-3 font-medium w-8">#</th>
						<th class="text-left px-4 py-3 font-medium">Mapel</th>
						<th class="text-left px-4 py-3 font-medium">Kelompok</th>
						<th class="text-center px-4 py-3 font-medium w-28">JP/Minggu</th>
						<th class="text-left px-4 py-3 font-medium">Guru Pengampu</th>
						<th class="text-center px-4 py-3 font-medium w-20">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if !selectedKelas}
						<tr><td colspan="6" class="px-4 py-12 text-center text-slate-400 text-sm">Pilih kelas untuk melihat kurikulum</td></tr>
					{:else if loading}
						<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Memuat data...</td></tr>
					{:else if mapelList.length === 0}
						<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Tidak ada data kurikulum</td></tr>
					{:else}
						{#each mapelList as item, idx (item.id_mapel)}
							<tr class="hover:bg-slate-50/50">
								<td class="px-4 py-3 text-slate-400 text-xs font-mono">{(page - 1) * limit + idx + 1}</td>
								<td class="px-4 py-3">
									<div class="font-medium text-slate-800">{item.nama_mapel}</div>
									<div class="text-[10px] text-slate-400 font-mono">{item.id_mapel}</div>
								</td>
								<td class="px-4 py-3">
									<span class="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">{item.kelompok}</span>
								</td>
								<td class="px-4 py-3 text-center">
									<input
										type="number"
										min="0"
										max="10"
										bind:value={item.total_jam_seminggu}
										disabled={isSaving(item.id_mapel)}
										class="w-16 text-center rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
									/>
								</td>
								<td class="px-4 py-3">
									<div class="relative">
										<input
											type="text"
											list="guru-{item.id_mapel}"
											value={item.nama_guru || ''}
											oninput={(e) => {
												const v = (e.target as HTMLInputElement).value;
												const found = guruList.find(g => g.nama_guru === v);
												if (found) {
													item.id_guru_pilih = found.id_guru;
													item.nama_guru = found.nama_guru;
												} else {
													item.id_guru_pilih = '';
												}
											}}
											placeholder="Cari guru..."
											disabled={isSaving(item.id_mapel)}
											class="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
										/>
										<datalist id="guru-{item.id_mapel}">
											{#each guruList as g}
												<option value={g.nama_guru} data-id={g.id_guru}>{g.nama_guru}</option>
											{/each}
										</datalist>
										{#if item.id_guru_pilih}
											<div class="text-[10px] text-slate-400 mt-0.5">{item.id_guru_pilih}</div>
										{/if}
									</div>
								</td>
								<td class="px-4 py-3 text-center">
									<button
										onclick={() => saveAlokasi(item)}
										disabled={isSaving(item.id_mapel)}
										class="px-3 py-1 text-xs font-medium rounded-lg border {isSaving(item.id_mapel) ? 'text-slate-300 border-slate-200' : 'text-blue-600 border-blue-200 hover:bg-blue-50'} transition-colors"
									>
										{isSaving(item.id_mapel) ? '...' : 'Simpan JP'}
									</button>
									<button
										onclick={() => savePlotting(item)}
										disabled={isSaving(item.id_mapel) || !item.id_guru_pilih}
										class="px-3 py-1 text-xs font-medium rounded-lg border ml-1 {isSaving(item.id_mapel) || !item.id_guru_pilih ? 'text-slate-300 border-slate-200' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'} transition-colors"
									>
										{isSaving(item.id_mapel) ? '...' : 'Plot'}
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if totalPages > 0}
			<div class="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
				<span>{totalItems > 0 ? `${(page - 1) * limit + 1}-${Math.min(page * limit, totalItems)} dari ${totalItems} mapel` : ''}</span>
				<div class="flex items-center gap-1">
					<button onclick={() => { page--; fetchData(); }} disabled={page <= 1} class="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50 text-sm font-medium">Prev</button>
					{#each Array.from({ length: Math.min(totalPages, 5) }, (_, i) => Math.max(1, Math.min(page - 2, totalPages - 4)) + i) as p}
						<button onclick={() => { page = p; fetchData(); }} class="w-8 h-8 rounded text-sm font-medium {p === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">{p}</button>
					{/each}
					<button onclick={() => { page++; fetchData(); }} disabled={page >= totalPages} class="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50 text-sm font-medium">Next</button>
				</div>
			</div>
		{/if}
	</div>
</div>
