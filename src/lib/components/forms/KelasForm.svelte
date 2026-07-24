<script lang="ts">
	let {
		data = { id_tahun_ajaran: 'TA-2627', id_tingkat: 'TKT10', id_jurusan: 'FAS-E', nama_sub_kelas: '' },
		onSave,
		onCancel
	} = $props();

	let form: any = $state({});

	$effect(() => {
		form = { ...data };
	});

	const tingkatList = [
		{ value: 'TKT10', label: 'Kelas 10' },
		{ value: 'TKT11', label: 'Kelas 11' },
		{ value: 'TKT12', label: 'Kelas 12' }
	];

	const jurusanList = [
		{ value: 'FAS-E', label: 'Fase E' },
		{ value: 'MIPA', label: 'MIPA' },
		{ value: 'IPS', label: 'IPS' }
	];
</script>

<form onsubmit={(e) => { e.preventDefault(); onSave(form); }} class="space-y-4">
	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="id_tingkat">Tingkat</label>
		<select id="id_tingkat" bind:value={form.id_tingkat} class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
			{#each tingkatList as t}
				<option value={t.value}>{t.label}</option>
			{/each}
		</select>
	</div>

	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="id_jurusan">Jurusan</label>
		<select id="id_jurusan" bind:value={form.id_jurusan} class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
			{#each jurusanList as j}
				<option value={j.value}>{j.label}</option>
			{/each}
		</select>
	</div>

	<div>
		<label class="block text-sm font-medium text-slate-700 mb-1" for="nama_sub_kelas">Nama Sub Kelas</label>
		<input id="nama_sub_kelas" type="text" bind:value={form.nama_sub_kelas} placeholder="Contoh: 1, MIPA-1, IPS-1" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
	</div>

	<div class="flex justify-end gap-3 pt-2">
		<button type="button" onclick={onCancel} class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Batal</button>
		<button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Simpan</button>
	</div>
</form>
