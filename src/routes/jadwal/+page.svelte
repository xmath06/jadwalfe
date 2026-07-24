<script lang="ts">
	import { api } from '$lib/api.js';
	import { authState } from '$lib/stores/auth.svelte.js';
	import { toastState } from '$lib/stores/toast.svelte.js';
	import { goto } from '$app/navigation';
	import * as XLSX from 'xlsx';

	type ViewMode = 'kelas' | 'guru';

		let mode = $state<ViewMode>('kelas');
		let guruSearch = $state('');
		let deckSearch = $state('');
	let scheduleData = $state<any[]>([]);
	let kelasList = $state<any[]>([]);
	let guruList = $state<any[]>([]);
	let sesiList = $state<any[]>([]);
	let mapels = $state<Record<string, any>>({});
	let unallocated = $state<any[]>([]);
	let loading = $state(true);
	let genStatus = $state<string | null>(null);
	let draggedItem = $state<{ source: 'grid' | 'deck'; data: any; fromHari?: string; fromSesiId?: number } | null>(null);
	let dragOverKey = $state<string | null>(null);

	const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

	// All active (non-istirahat) sessions — same structure across days.
	// jam_ke_dense counts ONLY active sessions (istirahat excluded), but numbering
	// continues across the break: 1,2,3,4, (istirahat), 5,6,7,8, (istirahat), 9,10.
	let activeSesiList = $derived.by(() => {
		let counter = 0;
		return sesiList
			.filter(s => s.hari === 'Senin' && !s.is_istirahat)
			.sort((a, b) => a.jam_ke - b.jam_ke)
			.map((s) => ({ ...s, jam_ke_dense: ++counter }));
	});

	// Ordered list (active + istirahat) by jam_ke — used to render break rows in place.
	// Active sessions carry jam_ke_dense (continuing 1..10); istirahat rows are a full red colspan.
	let orderedSesiList = $derived.by(() => {
		let counter = 0;
		return sesiList
			.filter(s => s.hari === 'Senin')
			.sort((a, b) => a.jam_ke - b.jam_ke)
			.map((s) => ({ ...s, jam_ke_dense: s.is_istirahat ? s.jam_ke : ++counter }));
	});

	const kelompokColors: Record<string, string> = {
		'Wajib': 'border-l-blue-500 bg-blue-50',
		'Peminatan MIPA': 'border-l-emerald-500 bg-emerald-50',
		'Peminatan IPS': 'border-l-orange-500 bg-orange-50',
		'Pilihan': 'border-l-purple-500 bg-purple-50'
	};

	const kelompokTextColors: Record<string, string> = {
		'Wajib': 'text-blue-700',
		'Peminatan MIPA': 'text-emerald-700',
		'Peminatan IPS': 'text-orange-700',
		'Pilihan': 'text-purple-700'
	};

	const kelompokBadgeColors: Record<string, string> = {
		'Wajib': 'bg-blue-100 text-blue-700',
		'Peminatan MIPA': 'bg-emerald-100 text-emerald-700',
		'Peminatan IPS': 'bg-orange-100 text-orange-700',
		'Pilihan': 'bg-purple-100 text-purple-700'
	};

		const gridRows = $derived(
		mode === 'kelas'
			? kelasList
			: guruList.filter(g =>
					!guruSearch.trim() ||
					g.nama_guru?.toLowerCase().includes(guruSearch.trim().toLowerCase()) ||
					g.id_guru?.toLowerCase().includes(guruSearch.trim().toLowerCase())
				)
	);

		const filteredUnallocated = $derived(
			!deckSearch.trim()
				? unallocated
				: unallocated.filter(u =>
						u.nama_guru?.toLowerCase().includes(deckSearch.trim().toLowerCase()) ||
						u.nama_mapel?.toLowerCase().includes(deckSearch.trim().toLowerCase()) ||
						u.nama_sub_kelas?.toLowerCase().includes(deckSearch.trim().toLowerCase())
					)
		);

	function getEntry(rowKey: string, hari: string, jamKeDense: number) {
		// Dense jam_ke is only for display order. Look up the REAL jam_ke (asli)
		// from the active session template, then match scheduleData by hari + jam_ke asli.
		const sesi = activeSesiList.find(s => s.jam_ke_dense === jamKeDense);
		const jamKeAsli = sesi?.jam_ke;
		if (jamKeAsli == null) return undefined;
		return scheduleData.find(e => {
			if (e.jam_ke !== jamKeAsli || e.hari !== hari) return false;
			if (mode === 'kelas') return e.id_kelas === rowKey;
			return e.id_guru === rowKey;
		});
	}

	function getRowLabel(item: any) {
		if (mode === 'kelas') {
			const tingkatLabel: Record<string, string> = { TKT10: 'X', TKT11: 'XI', TKT12: 'XII' };
			return `${tingkatLabel[item.id_tingkat] || item.id_tingkat} ${item.nama_sub_kelas}`;
		}
		return item.nama_guru;
	}

	function getRowSubLabel(item: any) {
		if (mode === 'kelas') {
			const jurusanLabel: Record<string, string> = { 'FAS-E': 'Fase E', MIPA: 'MIPA', IPS: 'IPS' };
			return jurusanLabel[item.id_jurusan] || item.id_jurusan;
		}
		return '';
	}

	async function loadAll() {
		loading = true;
		try {
			const [scheduleRes, kelasRes, guruRes, sesiRes, unallocRes] = await Promise.all([
				api.get('/jadwal', { params: { id_tahun_ajaran: 'TA-2627', limit: 2000 } }),
				api.get('/kelas', { params: { limit: 50 } }),
				api.get('/guru', { params: { limit: 100 } }),
				api.get('/sesi', { params: { id_tahun_ajaran: 'TA-2627' } }),
				api.get('/jadwal/unallocated', { params: { id_tahun_ajaran: 'TA-2627' } })
			]);

			scheduleData = scheduleRes.data || [];
			kelasList = kelasRes.data || [];
			guruList = guruRes.data || [];
			sesiList = sesiRes.data || [];
			unallocated = unallocRes.data || [];

			const m: Record<string, any> = {};
			for (const e of scheduleData) {
				if (e.id_mapel && !m[e.id_mapel]) m[e.id_mapel] = { nama_mapel: e.nama_mapel, kelompok: e.kelompok };
			}
			for (const u of unallocated) {
				if (u.id_mapel && !m[u.id_mapel]) m[u.id_mapel] = { nama_mapel: u.nama_mapel, kelompok: u.kelompok };
			}
			mapels = m;
		} catch (err) {
			toastState.error('Gagal memuat data papan jadwal');
		} finally {
			loading = false;
		}
	}

	// --- GENERATOR STATUS POLLING ---

	let genPollTimer = $state<any>(null);

	async function checkGenStatus() {
		try {
			const res = await api.get('/schedule/generate/status', {
				params: { id_sekolah: authState.id_sekolah || '1', id_tahun_ajaran: 'TA-2627' }
			});
			genStatus = res.status || 'IDLE';
			if (res.status === 'RUNNING' || res.status === 'PROCESSING') {
				genPollTimer = setTimeout(checkGenStatus, 2000);
			} else if (res.status === 'COMPLETED') {
				toastState.success(res.message || 'Jadwal selesai di-generate');
				genPollTimer = setTimeout(() => { genStatus = null; loadAll(); }, 500);
			} else if (res.status === 'FAILED') {
				toastState.error(res.message || 'Generate jadwal gagal');
				genPollTimer = setTimeout(() => { genStatus = null; }, 3000);
			}
		} catch {
			genStatus = null;
		}
	}

	async function startGenerate() {
		try {
			await api.post('/schedule/generate', {
				id_sekolah: authState.id_sekolah || '1',
				id_tahun_ajaran: 'TA-2627'
			});
			genStatus = 'RUNNING';
			toastState.info('Memulai generate jadwal otomatis...');
			genPollTimer = setTimeout(checkGenStatus, 2000);
		} catch (err) {
			toastState.error(err.message || 'Gagal memulai generate');
		}
	}

	function goToGenerate() {
		goto('/jadwal/generate');
	}

	// --- DRAG & DROP ---

	function handleDragStart(e: DragEvent, item: any, source: 'grid' | 'deck', fromHari?: string, fromSesiId?: number) {
		draggedItem = { source, data: item, fromHari, fromSesiId };
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', '');
		if (e.target instanceof HTMLElement) e.target.classList.add('opacity-50');
	}

	function handleDragEnd(e: DragEvent) {
		if (e.target instanceof HTMLElement) e.target.classList.remove('opacity-50');
		draggedItem = null;
		dragOverKey = null;
	}

	function handleDragOver(e: DragEvent, key: string) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		dragOverKey = key;
	}

	function handleDragLeave() {
		dragOverKey = null;
	}

	async function handleDrop(e: DragEvent, targetRowKey: string, targetHari: string, targetJamKe: number) {
		e.preventDefault();
		dragOverKey = null;
		if (!draggedItem) return;

		// Map dense jam_ke (display) back to the REAL jam_ke for the target day,
		// then resolve the actual id_sesi from sesiList (all days).
		const tmpl = activeSesiList.find(s => s.jam_ke_dense === targetJamKe);
		const realJamKe = tmpl?.jam_ke;
		const targetSesi = sesiList.find(s => s.hari === targetHari && s.jam_ke === realJamKe);
		if (!targetSesi || targetSesi.is_istirahat) {
			toastState.error('Tidak bisa menempatkan di sesi istirahat');
			return;
		}

		const source = draggedItem.source;
		const item = draggedItem.data;

		if (source === 'grid') {
			if (draggedItem.fromSesiId === targetSesi.id_sesi) return;

			const newSlot = {
				id_sekolah: item.id_sekolah || '1',
				id_tahun_ajaran: item.id_tahun_ajaran || 'TA-2627',
				id_kelas: item.id_kelas,
				id_mapel: item.id_mapel,
				id_guru: item.id_guru,
				id_ruangan: item.id_ruangan,
				id_sesi: targetSesi.id_sesi
			};

			const oldHari = item.hari;
			const oldJamKe = item.jam_ke;
			const oldSesiId = item.id_sesi;
			item.hari = targetHari;
			item.jam_ke = targetJamKe;
			item.id_sesi = targetSesi.id_sesi;

			try {
				await api.put(`/jadwal/${item.id_jadwal}`, newSlot);
				toastState.success('Kartu berhasil dipindahkan');
			} catch (err) {
				item.hari = oldHari;
				item.jam_ke = oldJamKe;
				item.id_sesi = oldSesiId;
				toastState.error(err.message || 'Bentrok: perpindahan dibatalkan');
			}
		} else {
			const total = item.jp_kurikulum ?? item.minimal_jp_per_pertemuan ?? 0;
			const baseEntry = {
				id_sekolah: authState.id_sekolah || '1',
				id_tahun_ajaran: 'TA-2627',
				id_kelas: item.id_kelas,
				id_mapel: item.id_mapel,
				id_guru: item.id_guru,
				id_ruangan: item.id_ruangan || 'R-UGM'
			};

			// Continuous-block rule: place all curriculum JP at once as a single
			// uninterrupted block starting from the dropped session on the same day.
			if (item.tidak_boleh_dipisah) {
				const daySesi = sesiList
					.filter(s => s.hari === targetHari && !s.is_istirahat)
					.sort((a, b) => a.jam_ke - b.jam_ke);
				const startIdx = daySesi.findIndex(s => s.jam_ke === targetSesi.jam_ke);
				const block = startIdx >= 0 ? daySesi.slice(startIdx, startIdx + total) : [];
				if (block.length < total) {
					toastState.error(`Butuh ${total} sesi berurutan mulai Jam ke-${targetJamKe} untuk mapel tidak boleh dipisah.`);
					return;
				}
				const alreadyBusy = block.some(s =>
					scheduleData.some(e => e.id_sesi === s.id_sesi && (mode === 'kelas' ? e.id_kelas === item.id_kelas : e.id_guru === item.id_guru))
				);
				if (alreadyBusy) {
					toastState.error('Ada sesi di blok tersebut sudah terisi. Pilih slot awal yang kosong.');
					return;
				}
				const slots = block.map(s => ({ ...baseEntry, id_sesi: s.id_sesi }));
				try {
					const res = await api.post('/jadwal/batch', { slots });
					const inserted = res.data;
					if (Array.isArray(inserted) && inserted.length === total) {
						const placed = inserted.map((row: any) => ({
							id_jadwal: row.id_jadwal,
							id_sekolah: row.id_sekolah,
							id_tahun_ajaran: row.id_tahun_ajaran,
							id_kelas: row.id_kelas,
							id_mapel: row.id_mapel,
							nama_mapel: item.nama_mapel,
							kelompok: item.kelompok,
							id_guru: row.id_guru,
							nama_guru: item.nama_guru,
							id_ruangan: row.id_ruangan,
							nama_ruangan: mapels?.[row.id_ruangan]?.nama_ruangan || row.id_ruangan,
							id_sesi: row.id_sesi,
							hari: targetHari,
							jam_ke: block.find(s => s.id_sesi === row.id_sesi)?.jam_ke,
							jp_kurikulum: item.jp_kurikulum,
							minimal_jp_per_pertemuan: item.minimal_jp_per_pertemuan,
							waktu_mulai: block.find(s => s.id_sesi === row.id_sesi)?.waktu_mulai,
							waktu_selesai: block.find(s => s.id_sesi === row.id_sesi)?.waktu_selesai
						}));
						scheduleData = [...scheduleData, ...placed];
						unallocated = unallocated.filter(u => u.id_plotting !== item.id_plotting);
						toastState.success(`Blok ${total} JP ditempatkan sebagai 1 rangkaian`);
					} else {
						await loadAll();
						unallocated = unallocated.filter(u => u.id_plotting !== item.id_plotting);
					}
				} catch (err: any) {
					toastState.error(err?.response?.data?.message || err.message || 'Bentrok: penempatan blok dibatalkan');
				}
				return;
			}

			// Normal (splittable) placement: one session per drop.
			const newEntry = { ...baseEntry, id_sesi: targetSesi.id_sesi };
			try {
				const res = await api.post('/jadwal', newEntry);
				const created = res.data;
				if (created && created.id_jadwal) {
					// Build a grid-ready entry from the server response so the
					// card appears immediately with the correct teacher name.
					const placed = {
						id_jadwal: created.id_jadwal,
						id_sekolah: created.id_sekolah,
						id_tahun_ajaran: created.id_tahun_ajaran,
						id_kelas: created.id_kelas,
						id_mapel: created.id_mapel,
						nama_mapel: item.nama_mapel,
						kelompok: item.kelompok,
						id_guru: created.id_guru,
						nama_guru: item.nama_guru,
						id_ruangan: created.id_ruangan,
						nama_ruangan: mapels?.[created.id_ruangan]?.nama_ruangan || created.id_ruangan,
						id_sesi: created.id_sesi,
						hari: targetHari,
						jam_ke: targetJamKe,
						jp_kurikulum: item.jp_kurikulum,
						minimal_jp_per_pertemuan: item.minimal_jp_per_pertemuan,
						waktu_mulai: targetSesi.waktu_mulai,
						waktu_selesai: targetSesi.waktu_selesai
					};
					scheduleData = [...scheduleData, placed];
					// Keep the card in the deck until its curriculum JP is fully placed.
					const filled = (item.jp_terisi ?? 0) + 1;
					if (filled >= total) {
						unallocated = unallocated.filter(u => u.id_plotting !== item.id_plotting);
					} else {
						unallocated = unallocated.map(u =>
							u.id_plotting === item.id_plotting ? { ...u, jp_terisi: filled } : u
						);
					}
					toastState.success('Kartu berhasil ditempatkan');
				} else {
					// Fallback: reload if the response shape is unexpected.
					await loadAll();
					unallocated = unallocated.filter(u => u.id_plotting !== item.id_plotting);
				}
			} catch (err) {
				toastState.error(err.message || 'Bentrok: penempatan dibatalkan');
			}
		}
		draggedItem = null;
	}

	function handleDeleteFromGrid(item: any) {
		if (!confirm(`Hapus ${item.nama_mapel} dari jadwal?`)) return;
		scheduleData = scheduleData.filter(e => e.id_jadwal !== item.id_jadwal);
		api.delete(`/jadwal/${item.id_jadwal}`)
			.then(() => {
				toastState.success('Kartu dikembalikan ke kantong');
				loadAll();
			})
			.catch((err) => {
				toastState.error(err.message || 'Gagal menghapus');
				loadAll();
			});
	}

	function exportToExcel() {
		const wb = XLSX.utils.book_new();
		const items = gridRows;
		for (const item of items) {
			const rowKey = mode === 'kelas' ? item.id_kelas : item.id_guru;
			const sheetName = (mode === 'kelas' ? getRowLabel(item) : item.nama_guru)
				.replace(/[\\/*?:[\]]/g, '')
				.slice(0, 28) || 'Sheet';

			// Struktur SAMA dengan grid: header = Hari (kolom), baris = Jam ke + Waktu (sesi ke bawah)
			const header = ['Jam Ke', 'Waktu'];
			for (const hari of hariList) header.push(hari);
			const rows: any[] = [header];

			// Track istirahat rows (1-based, after header) for merge ranges
			const istirahatRows: number[] = [];
			let dataRow = 1; // header is row 0
			for (const sesi of orderedSesiList) {
				if (sesi.is_istirahat) {
					// Single merged cell across all columns
					rows.push([`🕑 ISTIRAHAT`]);
					istirahatRows.push(dataRow); // 1-based row in sheet
					dataRow++;
					continue;
				}
				const row: any[] = [String(sesi.jam_ke_dense), `${hourMin(sesi.waktu_mulai)}-${hourMin(sesi.waktu_selesai)}`];
				for (const hari of hariList) {
					const entry = getEntry(rowKey, hari, sesi.jam_ke_dense);
					if (entry) {
						row.push(`${entry.nama_mapel}\n${entry.nama_guru}\n${entry.nama_ruangan}`);
					} else {
						row.push('');
					}
				}
				rows.push(row);
				dataRow++;
			}

			const ws = XLSX.utils.aoa_to_sheet(rows);
			// Merge istirahat rows across all columns (A..last)
			const lastCol = XLSX.utils.encode_col(1 + hariList.length); // 2 labels + N hari
			if (istirahatRows.length > 0) {
				ws['!merges'] = istirahatRows.map(r => ({
					s: { r, c: 0 },
					e: { r, c: 1 + hariList.length }
				}));
				// Center-align the merged istirahat cell
				for (const r of istirahatRows) {
					const addr = XLSX.utils.encode_cell({ r, c: 0 });
					if (!ws[addr]) ws[addr] = { t: 's', v: '' };
					ws[addr].s = { alignment: { horizontal: 'center', vertical: 'center' }, font: { bold: true } };
				}
			}
			XLSX.utils.book_append_sheet(wb, ws, sheetName);
		}
		const fileName = mode === 'kelas' ? 'jadwal_per_kelas.xlsx' : 'jadwal_per_guru.xlsx';
		XLSX.writeFile(wb, fileName);
	}

	$effect(() => {
		loadAll();
		return () => { if (genPollTimer) clearTimeout(genPollTimer); };
	});

	function hourMin(t: string) { return t?.slice(0, 5) || ''; }
</script>

<div class="p-6">
	<!-- Top Toolbar -->
	<div class="flex items-center justify-between mb-4 flex-wrap gap-2">
		<div class="flex items-center gap-3">
			<h1 class="text-xl font-bold text-slate-800">Papan Jadwal</h1>
			<div class="flex bg-slate-100 rounded-lg p-0.5">
				<button onclick={() => mode = 'kelas'} class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {mode === 'kelas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">Mode Kelas</button>
				<button onclick={() => mode = 'guru'} class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {mode === 'guru' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">Mode Guru</button>
			</div>
			{#if mode === 'guru'}
				<div class="relative">
					<svg class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
					<input
						type="text"
						bind:value={guruSearch}
						placeholder="Cari guru untuk diprioritaskan..."
						class="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64"
					/>
				</div>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<button onclick={goToGenerate} class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
				Picu Generate Otomatis
			</button>
			<button onclick={exportToExcel} class="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				Export
			</button>
		</div>
	</div>

	<!-- Generation Status Banner -->
	{#if genStatus === 'RUNNING' || genStatus === 'PROCESSING'}
		<div class="mb-3 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3 text-sm text-indigo-700">
			<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
			Proses generate jadwal sedang berjalan...
			<button onclick={goToGenerate} class="ml-auto text-xs font-medium underline hover:no-underline">Lihat Detail</button>
		</div>
	{/if}

	<div class="flex gap-4">
		<!-- Grid Area -->
		<div class="flex-1 min-w-0 overflow-auto">
			{#if loading}
				<div class="p-8 text-center text-slate-500">Memuat papan jadwal...</div>
			{:else}
				<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
					<div class="overflow-auto" style="max-height: calc(100vh - 180px);">
						<table class="w-full text-xs border-collapse">
							<thead class="sticky top-0 z-20">
								<tr class="bg-slate-50">
									{#if mode === 'kelas'}
									<th class="sticky left-0 z-30 bg-slate-50 border-r border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-600 min-w-[80px] w-[80px]">
										<span class="text-[11px] uppercase tracking-wider">Kelas</span>
									</th>
									{/if}
								{#if mode === 'kelas'}
								<th class="sticky left-[80px] z-30 bg-slate-50 border-r border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-600 min-w-[80px] w-[80px]">
									<span class="text-[11px] uppercase tracking-wider">Jam Sesi</span>
								</th>
								{:else}
								<th class="sticky left-0 z-30 bg-slate-50 border-r border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-600 min-w-[80px] w-[80px]">
									<span class="text-[11px] uppercase tracking-wider">Jam Sesi</span>
								</th>
								{/if}
									{#each hariList as hari}
										<th class="border-r border-b border-slate-200 px-2 py-2 text-center font-semibold text-slate-600 min-w-[90px]">
											<span class="text-[11px] uppercase tracking-wider">{hari}</span>
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each gridRows as row}
									{@const sesiCount = activeSesiList.length}
									{#each orderedSesiList as sesi, si}
										{@const rowKey = mode === 'kelas' ? row.id_kelas : row.id_guru}

										{#if sesi.is_istirahat}
											<tr class="bg-red-100">
												{#if si === 0 && mode === 'kelas'}
													<td rowspan={sesiCount} class="sticky left-0 z-10 bg-white border-r border-b border-slate-200 px-2 py-1.5 text-sm font-medium text-slate-700 align-top">
														<div class="pt-1">{getRowLabel(row)}</div>
														{#if getRowSubLabel(row)}
															<div class="text-[10px] text-slate-400">{getRowSubLabel(row)}</div>
														{/if}
													</td>
												{/if}
												<td colspan={hariList.length + (mode === 'kelas' ? 1 : 0)} class="border-b border-red-200 px-3 py-1.5 text-center text-[11px] font-semibold text-red-700">
													🕑 Istirahat
												</td>
											</tr>
										{:else}
											<tr class="hover:bg-slate-50/50">
												{#if si === 0 && mode === 'kelas'}
													<td rowspan={sesiCount} class="sticky left-0 z-10 bg-white border-r border-b border-slate-200 px-2 py-1.5 text-sm font-medium text-slate-700 align-top">
														<div class="pt-1">{getRowLabel(row)}</div>
														{#if getRowSubLabel(row)}
															<div class="text-[10px] text-slate-400">{getRowSubLabel(row)}</div>
														{/if}
													</td>
												{/if}
											<td class="sticky {mode === 'kelas' ? 'left-[80px]' : 'left-0'} z-10 bg-white border-r border-b border-slate-200 px-2 py-1.5 text-center text-[11px] text-slate-500 whitespace-nowrap">
												Jam ke-{sesi.jam_ke_dense}
												<div class="text-[9px] text-slate-300">{hourMin(sesi.waktu_mulai)}-{hourMin(sesi.waktu_selesai)}</div>
											</td>
											{#each hariList as hari}
												{@const cellKey = rowKey + ':' + hari + ':' + sesi.jam_ke_dense}
												{@const entry = getEntry(rowKey, hari, sesi.jam_ke)}
												<td
													class="border-r border-b border-slate-100 p-0.5 align-top min-h-[44px] align-middle {dragOverKey === cellKey ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset' : sesi.is_istirahat ? 'bg-red-50/50' : ''}"
													ondragover={(e) => handleDragOver(e, cellKey)}
													ondragleave={handleDragLeave}
													ondrop={(e) => handleDrop(e, rowKey, hari, sesi.jam_ke_dense)}
												>
													{#if entry && !sesi.is_istirahat}
														{@const targetSesi = sesiList.find(s => s.hari === hari && s.jam_ke === sesi.jam_ke)}
														<!-- svelte-ignore a11y_no_static_element_interactions -->
														<div
															class="relative group rounded p-1 cursor-grab active:cursor-grabbing border-l-[3px] {kelompokColors[entry.kelompok] || 'border-l-slate-400 bg-slate-50'} hover:shadow-md transition-shadow"
															draggable="true"
															ondragstart={(e) => handleDragStart(e, entry, 'grid', hari, targetSesi?.id_sesi)}
															ondragend={handleDragEnd}
															title={`${entry.nama_mapel} — ${entry.nama_guru} @ ${entry.nama_ruangan}`}
														>
													<div class="font-semibold text-[11px] leading-tight {kelompokTextColors[entry.kelompok] || 'text-slate-700'} truncate">{entry.nama_mapel}</div>
													<div class="text-[10px] text-slate-500 truncate leading-tight">{entry.nama_guru}</div>
													<div class="flex items-center justify-between mt-0.5">
														<span class="text-[9px] text-slate-400 truncate">{entry.nama_ruangan}</span>
														<span class="text-[9px] font-medium {kelompokBadgeColors[entry.kelompok] || 'text-slate-400'} px-1 rounded">{entry.jp_kurikulum ?? entry.minimal_jp_per_pertemuan} JP</span>
													</div>
														<button
															onclick={(e) => { e.stopPropagation(); handleDeleteFromGrid(entry); }}
															aria-label="Hapus jadwal"
															class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 flex items-center justify-center transition-opacity"
															>
																<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
															</button>
														</div>
													{:else if !sesi.is_istirahat}
														<div class="h-[44px] rounded border border-dashed border-transparent hover:border-slate-300 transition-colors"></div>
													{/if}
												</td>
											{/each}
										</tr>
										{/if}
									{/each}
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>

		<!-- Unallocated Deck -->
		<div class="w-64 flex-shrink-0">
			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
				<h2 class="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
					<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
					Kantong Pelajaran
					<span class="ml-auto text-xs text-slate-400 font-normal">{unallocated.length} belum terplot</span>
				</h2>
				<div class="relative mb-2">
					<svg class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
					<input
						type="text"
						bind:value={deckSearch}
						placeholder="Cari guru / mapel / kelas..."
						class="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
					/>
				</div>
				<div class="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto">
					{#each filteredUnallocated as item (item.id_plotting)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="rounded-md p-2 border-l-[3px] cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow {kelompokColors[item.kelompok] || 'border-l-slate-400 bg-slate-50'}"
							draggable="true"
							ondragstart={(e) => handleDragStart(e, item, 'deck')}
							ondragend={handleDragEnd}
							title={`${item.nama_mapel} — ${item.nama_guru} — ${item.nama_sub_kelas}`}
						>
							<div class="font-semibold text-[12px] leading-tight {kelompokTextColors[item.kelompok] || 'text-slate-700'} truncate">{item.nama_mapel}</div>
							<div class="text-[11px] text-slate-500 truncate">{item.nama_guru}</div>
							<div class="flex items-center justify-between mt-0.5">
								<span class="text-[10px] text-slate-400">{item.nama_sub_kelas}</span>
								<span class="text-[9px] font-medium {kelompokBadgeColors[item.kelompok] || 'text-slate-400'} px-1 rounded">{item.jp_terisi ?? 0}/{item.jp_kurikulum ?? item.minimal_jp_per_pertemuan} JP</span>
							</div>
						</div>
					{:else}
						{#if !loading}
							<p class="text-xs text-slate-400 text-center py-4">Semua pelajaran sudah terplot</p>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Legend -->
			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mt-2">
				<h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Legenda</h3>
				<div class="space-y-1">
					{#each Object.entries(kelompokColors) as [kelompok, cls]}
						<div class="flex items-center gap-2 text-[11px] text-slate-600">
							<span class="w-3 h-3 rounded-sm border-l-[3px] {cls.split(' ')[0]}"></span>
							{kelompok}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
