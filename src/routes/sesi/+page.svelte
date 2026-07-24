<script lang="ts">
	import { api } from '$lib/api.js';
	import { toastState } from '$lib/stores/toast.svelte.js';
	import { authState } from '$lib/stores/auth.svelte.js';

	let data = $state([]);
	let loading = $state(false);
	let showModal = $state(false);
	let editItem = $state(null);
	const idTahunAjaran = 'TA-2627';
	const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

	let form = $state({
		id_tahun_ajaran: idTahunAjaran,
		hari: 'Senin',
		jam_ke: 1,
		waktu_mulai: '',
		waktu_selesai: '',
		is_istirahat: false,
		keterangan: ''
	});

	async function fetchData() {
		loading = true;
		try {
			const res = await api.get('/sesi', { params: { id_tahun_ajaran: idTahunAjaran } });
			data = res.data || [];
		} catch (err) {
			toastState.error(err.message || 'Gagal memuat data');
		} finally {
			loading = false;
		}
	}

	function openAdd() {
		editItem = null;
		form = {
			id_tahun_ajaran: idTahunAjaran,
			hari: 'Senin',
			jam_ke: 1,
			waktu_mulai: '',
			waktu_selesai: '',
			is_istirahat: false,
			keterangan: ''
		};
		showModal = true;
	}

	function openEdit(item) {
		editItem = { ...item };
		form = {
			id_tahun_ajaran: item.id_tahun_ajaran,
			hari: item.hari,
			jam_ke: item.jam_ke,
			waktu_mulai: item.waktu_mulai ? item.waktu_mulai.slice(0, 5) : '',
			waktu_selesai: item.waktu_selesai ? item.waktu_selesai.slice(0, 5) : '',
			is_istirahat: item.is_istirahat,
			keterangan: item.keterangan || ''
		};
		showModal = true;
	}

	async function handleSave() {
		try {
			const payload = {
				id_sekolah: authState.id_sekolah,
				...form
			};
			if (editItem) {
				await api.put(`/sesi/${editItem.id_sesi}`, payload);
				toastState.success('Sesi berhasil diperbarui');
			} else {
				await api.post('/sesi', payload);
				toastState.success('Sesi berhasil ditambahkan');
			}
			showModal = false;
			fetchData();
		} catch (err) {
			toastState.error(err.message || 'Gagal menyimpan sesi');
		}
	}

	async function handleDelete(id) {
		if (!confirm('Hapus sesi ini?')) return;
		try {
			await api.delete(`/sesi/${id}`);
			toastState.success('Sesi berhasil dihapus');
			fetchData();
		} catch (err) {
			toastState.error(err.message || 'Gagal menghapus sesi');
		}
	}

	$effect(() => { fetchData(); });
</script>

<div class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-xl font-bold text-slate-800">Konfigurasi Sesi</h1>
		<button onclick={openAdd} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			Tambah Sesi
		</button>
	</div>

	<div class="bg-white rounded-xl shadow-sm border border-slate-200">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-50 text-slate-600 text-xs uppercase">
					<tr>
						<th class="text-left px-4 py-3 font-medium">Hari</th>
						<th class="text-left px-4 py-3 font-medium">Jam Ke</th>
						<th class="text-left px-4 py-3 font-medium">Waktu Mulai</th>
						<th class="text-left px-4 py-3 font-medium">Waktu Selesai</th>
						<th class="text-center px-4 py-3 font-medium">Istirahat?</th>
						<th class="text-center px-4 py-3 font-medium">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Memuat data...</td></tr>
					{:else if data.length === 0}
						<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Tidak ada data</td></tr>
					{:else}
						{#each data as item (item.id_sesi)}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-3 font-medium text-slate-800">{item.hari}</td>
								<td class="px-4 py-3 text-slate-700">{item.jam_ke}</td>
								<td class="px-4 py-3 text-slate-700">{item.waktu_mulai ? item.waktu_mulai.slice(0, 5) : '-'}</td>
								<td class="px-4 py-3 text-slate-700">{item.waktu_selesai ? item.waktu_selesai.slice(0, 5) : '-'}</td>
								<td class="px-4 py-3 text-center">
									{#if item.is_istirahat}
										<span class="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Istirahat</span>
									{:else}
										<span class="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">Belajar</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center justify-center gap-2">
										<button onclick={() => openEdit(item)} class="p-1.5 rounded text-blue-600 hover:bg-blue-50" title="Edit">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
										</button>
										<button onclick={() => handleDelete(item.id_sesi)} class="p-1.5 rounded text-red-600 hover:bg-red-50" title="Hapus">
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
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onclick={() => showModal = false} role="presentation" tabindex="-1">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
			<div class="px-6 py-4 border-b border-slate-200">
				<h2 class="text-lg font-semibold text-slate-800">{editItem ? 'Edit Sesi' : 'Tambah Sesi'}</h2>
			</div>
			<div class="px-6 py-4 space-y-4">
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">Hari</label>
					<select bind:value={form.hari} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
						{#each hariList as h}
							<option value={h}>{h}</option>
						{/each}
					</select>
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">Jam Ke</label>
					<input type="number" min="1" bind:value={form.jam_ke} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-sm font-medium text-slate-700 mb-1">Waktu Mulai</label>
						<input type="time" bind:value={form.waktu_mulai} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-sm font-medium text-slate-700 mb-1">Waktu Selesai</label>
						<input type="time" bind:value={form.waktu_selesai} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
				</div>
				<div class="flex items-center gap-2">
					<input type="checkbox" bind:checked={form.is_istirahat} id="istirahat" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
					<label for="istirahat" class="text-sm text-slate-700">Tandai sebagai jam istirahat</label>
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
					<input type="text" bind:value={form.keterangan} placeholder="Mis. Jam pelajaran 1" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
			</div>
			<div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
				<button onclick={() => showModal = false} class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
				<button onclick={handleSave} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Simpan</button>
			</div>
		</div>
	</div>
{/if}
