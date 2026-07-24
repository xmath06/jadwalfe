<script lang="ts">
	import { api } from '$lib/api.js';
	import { toastState } from '$lib/stores/toast.svelte.js';

	type CetakMode = 'kelas' | 'guru';
	type TampilkanMode = 'semua' | 'tunggal';

	let cetakMode = $state<CetakMode>('kelas');
	let tampilkanMode = $state<TampilkanMode>('semua');
	let selectedId = $state('');
	let kelasList = $state<any[]>([]);
	let guruList = $state<any[]>([]);
	let sesiList = $state<any[]>([]);
	let scheduleData = $state<any[]>([]);
	let loading = $state(false);

	const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

	let allSesiList = $derived.by(() => {
		return sesiList.filter((s, i, arr) => arr.findIndex(x => x.jam_ke === s.jam_ke) === i).sort((a, b) => a.jam_ke - b.jam_ke);
	});

	let filteredItems = $derived(cetakMode === 'kelas' ? kelasList : guruList);

	const tingkatLabel: Record<string, string> = { TKT10: 'X', TKT11: 'XI', TKT12: 'XII' };
	const jurusanLabel: Record<string, string> = { 'FAS-E': '', MIPA: 'MIPA', IPS: 'IPS' };

	function getLabel(item: any) {
		if (cetakMode === 'kelas') return `${tingkatLabel[item.id_tingkat] || item.id_tingkat} ${item.nama_sub_kelas}`;
		return item.nama_guru;
	}

	function getSub(item: any) {
		if (cetakMode === 'kelas') return jurusanLabel[item.id_jurusan] || '';
		return '';
	}

	function getEntry(itemId: string, hari: string, jamKe: number) {
		return scheduleData.find(e => {
			if (e.hari !== hari || e.jam_ke !== jamKe) return false;
			return cetakMode === 'kelas' ? e.id_kelas === itemId : e.id_guru === itemId;
		});
	}

	const kelompokColors: Record<string, string> = {
		'Wajib': 'bg-blue-50 border-l-blue-400',
		'Peminatan MIPA': 'bg-emerald-50 border-l-emerald-400',
		'Peminatan IPS': 'bg-orange-50 border-l-orange-400',
		'Pilihan': 'bg-purple-50 border-l-purple-400'
	};

	async function loadReferences() {
		try {
			const [kelasRes, guruRes, sesiRes] = await Promise.all([
				api.get('/kelas', { params: { limit: 50 } }),
				api.get('/guru', { params: { limit: 100 } }),
				api.get('/sesi', { params: { id_tahun_ajaran: 'TA-2627' } })
			]);
			kelasList = kelasRes.data || [];
			guruList = guruRes.data || [];
			sesiList = sesiRes.data || [];
		} catch {
			toastState.error('Gagal memuat data referensi');
		}
	}

	function itemId(item: any) { return cetakMode === 'kelas' ? item.id_kelas : item.id_guru; }

	function itemsToPrint(): any[] {
		if (tampilkanMode === 'tunggal' && selectedId) {
			const item = filteredItems.find(i => itemId(i) === selectedId);
			return item ? [item] : [];
		}
		return filteredItems;
	}

	function getScheduleForItem(iid: string) {
		const params: Record<string, any> = { id_tahun_ajaran: 'TA-2627' };
		if (cetakMode === 'kelas') params.id_kelas = iid;
		else params.id_guru = iid;
		return api.get('/jadwal', { params: { ...params, limit: 2000 } });
	}

	async function onSelectChange() {
		if (!selectedId) { scheduleData = []; return; }
		loading = true;
		try {
			const res = await getScheduleForItem(selectedId);
			scheduleData = res.data || [];
		} catch {
			toastState.error('Gagal memuat jadwal');
		} finally {
			loading = false;
		}
	}

	async function loadAndPrint() {
		const items = itemsToPrint();
		if (items.length === 0) {
			toastState.warning('Pilih item yang akan dicetak');
			return;
		}
		loading = true;
		try {
			const results = await Promise.all(items.map(i => getScheduleForItem(itemId(i))));
			scheduleData = results.flatMap(r => r.data || []);
		} catch {
			toastState.error('Gagal memuat jadwal');
			loading = false;
			return;
		}
		loading = false;
		setTimeout(() => window.print(), 300);
	}

	function changeMode(mode: CetakMode) {
		cetakMode = mode;
		selectedId = '';
		scheduleData = [];
	}

	function hourMin(t: string) { return t?.slice(0, 5) || ''; }

	function classShort(itemId: string): string {
		const k = kelasList.find(c => c.id_kelas === itemId);
		if (!k) return itemId;
		return `${tingkatLabel[k.id_tingkat] || k.id_tingkat} ${k.nama_sub_kelas}`;
	}

	$effect(() => { loadReferences(); });
</script>

<svelte:head>
	<title>Cetak Jadwal</title>
</svelte:head>

<div class="p-6 print:p-0">
	<!-- Toolbar -->
	<div class="print:hidden mb-6">
		<h1 class="text-xl font-bold text-slate-800 mb-4">Cetak Jadwal</h1>

		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
			<div class="flex flex-wrap items-center gap-4">
				<div class="flex bg-slate-100 rounded-lg p-0.5">
					<button onclick={() => changeMode('kelas')} class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {cetakMode === 'kelas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">Per Kelas</button>
					<button onclick={() => changeMode('guru')} class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {cetakMode === 'guru' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">Per Guru</button>
				</div>

				<div class="flex bg-slate-100 rounded-lg p-0.5">
					<button onclick={() => { tampilkanMode = 'semua'; scheduleData = []; }} class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {tampilkanMode === 'semua' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">Cetak Semua</button>
					<button onclick={() => { tampilkanMode = 'tunggal'; scheduleData = []; }} class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {tampilkanMode === 'tunggal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">Pilih Satu</button>
				</div>

				{#if tampilkanMode === 'tunggal'}
					<select bind:value={selectedId} onchange={onSelectChange} class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
						<option value="">-- Pilih {cetakMode === 'kelas' ? 'Kelas' : 'Guru'} --</option>
						{#each filteredItems as item}
							<option value={itemId(item)}>{getLabel(item)}{getSub(item) ? ' (' + getSub(item) + ')' : ''}</option>
						{/each}
					</select>
				{/if}

				<button onclick={loadAndPrint} disabled={loading} class="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
					{loading ? 'Memuat...' : tampilkanMode === 'semua' ? `Cetak Semua ${cetakMode === 'kelas' ? 'Kelas' : 'Guru'}` : 'Cetak'}
				</button>
			</div>
		</div>
	</div>

	<!-- Preview / Print Area -->
	{#if scheduleData.length > 0}
		{#each itemsToPrint() as item, idx}
			{@const iid = itemId(item)}
			{@const itemSchedule = scheduleData.filter(e => iid === (cetakMode === 'kelas' ? e.id_kelas : e.id_guru))}
			{@const label = getLabel(item)}
			{@const sub = getSub(item)}

			<div class="print-page mb-8 print:mb-0 {idx > 0 ? 'print:page-break-before' : ''}">
				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border print:rounded-none">
					<div class="text-center mb-4 print:mb-2">
						<h2 class="text-base font-bold text-slate-800 print:text-sm">
							Jadwal Pelajaran{cetakMode === 'kelas' ? ` — Kelas ${label}${sub ? ' (' + sub + ')' : ''}` : ` — ${label}`}
						</h2>
						<p class="text-xs text-slate-500">Tahun Ajaran 2026/2027 — Semester Ganjil</p>
					</div>

					{#if itemSchedule.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full text-xs border-collapse border border-slate-300">
								<thead>
									<tr class="bg-slate-100">
										<th class="border border-slate-300 px-2 py-1.5 text-left font-semibold text-slate-700 w-16">Hari</th>
										{#each allSesiList as sesi}
											<th class="border border-slate-300 px-1 py-1.5 text-center font-semibold text-slate-600 min-w-[70px] {sesi.is_istirahat ? 'bg-red-50 text-red-400' : ''}">
												<div>#{sesi.jam_ke}</div>
												<div class="text-[9px] font-normal text-slate-400">{hourMin(sesi.waktu_mulai)}</div>
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each hariList as hari}
										<tr>
											<td class="border border-slate-300 px-2 py-1.5 font-medium text-slate-700 bg-slate-50/50 whitespace-nowrap">{hari}</td>
											{#each allSesiList as sesi}
												{@const entry = getEntry(iid, hari, sesi.jam_ke)}
												<td class="border border-slate-300 p-1 align-top {sesi.is_istirahat ? 'bg-red-50/50' : ''}">
													{#if entry && !sesi.is_istirahat}
														{@const color = kelompokColors[entry.kelompok] || 'bg-slate-50 border-l-slate-300'}
														<div class="rounded border-l-[3px] px-1.5 py-1 {color}">
															<div class="font-semibold text-[11px] leading-tight">{entry.nama_mapel}</div>
															<div class="text-[10px] text-slate-500 leading-tight">
																{cetakMode === 'kelas' ? entry.nama_guru : classShort(entry.id_kelas)}
															</div>
															<div class="text-[9px] text-slate-400 leading-tight">{entry.nama_ruangan}</div>
														</div>
													{/if}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="text-center text-slate-400 text-sm py-6">Belum ada jadwal untuk item ini</p>
					{/if}
				</div>
			</div>
		{/each}
	{:else if !loading}
		<div class="text-center text-slate-400 py-16 print:hidden">
			<svg class="w-16 h-16 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
			<p class="text-sm">Pilih opsi cetak di atas, lalu klik tombol Cetak</p>
		</div>
	{/if}
</div>

<style>
	@media print {
		@page {
			size: A4 landscape;
			margin: 10mm 6mm;
		}

		:global(body) {
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		:global(aside),
		:global(header),
		:global(nav),
		:global(.fixed),
		:global(.min-h-screen > aside),
		:global(.min-h-screen > div > header) {
			display: none !important;
		}

		.print-page {
			display: block !important;
			page-break-after: always;
			break-after: page;
		}

		.print-page:last-child {
			page-break-after: avoid;
			break-after: auto;
		}

		table { font-size: 8px !important; }
		table th, table td { padding: 1.5px 2px !important; }
	}
</style>
