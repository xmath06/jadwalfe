<script lang="ts">
	let {
		data = { nama_guru: '', tanggal_lahir: '', status: 'Aktif', gunakan_prioritas_pagi: false, gunakan_prioritas_kontinu: false },
		onSave,
		onCancel
	} = $props();

	let form: any = $state({});

	$effect(() => {
		form = { ...data };
	});

	let isPagiInvalid = $derived(form.gunakan_prioritas_kontinu && form.gunakan_prioritas_pagi);
</script>

<form onsubmit={(e) => { e.preventDefault(); if (!isPagiInvalid) onSave(form); }} class="space-y-4">
	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="nama_guru">Nama Guru</label>
		<input id="nama_guru" type="text" bind:value={form.nama_guru} class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
	</div>

	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="tanggal_lahir">Tanggal Lahir</label>
		<input id="tanggal_lahir" type="date" bind:value={form.tanggal_lahir} class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
	</div>

	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="status">Status</label>
		<select id="status" bind:value={form.status} class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
			<option value="Aktif">Aktif</option>
			<option value="Tidak Aktif">Tidak Aktif</option>
		</select>
	</div>

	<div class="space-y-3">
		<label class="flex items-center gap-3 cursor-pointer select-none">
			<input type="checkbox" bind:checked={form.gunakan_prioritas_pagi} class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
			<div>
				<span class="text-sm font-medium text-slate-700">Prioritas Jam Pagi</span>
				<p class="text-xs text-slate-500">Guru hanya bisa ditempatkan di jam pelajaran awal</p>
			</div>
		</label>

		<label class="flex items-center gap-3 cursor-pointer select-none">
			<input type="checkbox" bind:checked={form.gunakan_prioritas_kontinu} class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
			<div>
				<span class="text-sm font-medium text-slate-700">Prioritas Jadwal Kontinu</span>
				<p class="text-xs text-slate-500">Guru menghendaki jadwal mengajar padat tanpa jeda</p>
			</div>
		</label>
	</div>

	{#if isPagiInvalid}
		<p class="text-red-500 text-xs font-medium bg-red-50 p-2 rounded border border-red-200">Prioritas pagi dan kontinu tidak bisa dipilih bersamaan</p>
	{/if}

	<div class="flex justify-end gap-3 pt-2">
		<button type="button" onclick={onCancel} class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
		<button type="submit" disabled={isPagiInvalid} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed">Simpan</button>
	</div>
</form>
