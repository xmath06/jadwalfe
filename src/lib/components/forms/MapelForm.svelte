<script lang="ts">
	let {
		data = { nama_mapel: '', kelompok: 'Wajib', minimal_jp_per_pertemuan: 2, wajib_jam_pagi: false },
		onSave,
		onCancel
	} = $props();

	let form: any = $state({});

	$effect(() => {
		form = { ...data };
	});

	const isJpInvalid = $derived(false);
</script>

<form onsubmit={(e) => { e.preventDefault(); if (!isJpInvalid) onSave(form); }} class="space-y-4">
	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="nama_mapel">Nama Mata Pelajaran</label>
		<input id="nama_mapel" type="text" bind:value={form.nama_mapel} class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
	</div>

	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="kelompok">Kelompok</label>
		<select id="kelompok" bind:value={form.kelompok} class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
			<option value="Wajib">Wajib</option>
			<option value="Peminatan MIPA">Peminatan MIPA</option>
			<option value="Peminatan IPS">Peminatan IPS</option>
			<option value="Pilihan">Pilihan</option>
		</select>
	</div>

	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="minimal_jp">Minimal JP per Pertemuan</label>
		<input id="minimal_jp" type="number" bind:value={form.minimal_jp_per_pertemuan} class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" max="10" required />
	</div>

	<div class="space-y-3">
		<label class="flex items-center gap-3 cursor-pointer select-none">
			<input type="checkbox" bind:checked={form.wajib_jam_pagi} class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
			<div>
				<span class="text-sm font-medium text-slate-700">Wajib Jam Pagi</span>
				<p class="text-xs text-slate-500">Harus ditempatkan di sesi pagi hari</p>
			</div>
		</label>
	</div>

	<div class="flex justify-end gap-3 pt-2">
		<button type="button" onclick={onCancel} class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
		<button type="submit" disabled={isJpInvalid} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed">Simpan</button>
	</div>
</form>
