<script lang="ts">
	let {
		data = { nama_ruangan: '', jenis_ruangan: 'Teori' },
		onSave,
		onCancel
	} = $props();

	let form: any = $state({});

	$effect(() => {
		form = { ...data };
	});
</script>

<form onsubmit={(e) => { e.preventDefault(); onSave(form); }} class="space-y-4">
	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="nama_ruangan">Nama Ruangan</label>
		<input id="nama_ruangan" type="text" bind:value={form.nama_ruangan} placeholder="Contoh: R-101, Lab Komputer A" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
	</div>

	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="jenis_ruangan">Tipe Ruangan</label>
		<select id="jenis_ruangan" bind:value={form.jenis_ruangan} class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
			<option value="Teori">Teori</option>
			<option value="Praktek">Praktek</option>
			<option value="Lapangan">Lapangan</option>
		</select>
	</div>

	<div class="flex justify-end gap-3 pt-2">
		<button type="button" onclick={onCancel} class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
		<button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Simpan</button>
	</div>
</form>
