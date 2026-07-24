<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth.svelte.js';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	let { children } = $props();

	let sidebarOpen = $state(false);

	function isActive(href) {
		return $page.url.pathname.startsWith(href);
	}

	function handleLogout() {
		authState.logout();
		goto('/login');
	}

	let isLoginPage = $derived($page.url.pathname === '/login');
	let isAuthenticated = $derived(authState.isAuthenticated);

	$effect(() => {
		if (browser && !isLoginPage && !isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Penjadwalan SMA</title>
</svelte:head>

<ToastContainer />

{#if isLoginPage || !isAuthenticated}
	{@render children()}
{:else}
	<div class="min-h-screen flex bg-slate-50">
		<aside class="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 max-md:hidden">
			<div class="h-16 flex items-center px-6 border-b border-slate-200">
				<h1 class="text-lg font-bold text-slate-800">Penjadwalan</h1>
			</div>

			<nav class="flex-1 py-4 px-3 space-y-1">
				<a href="/dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/dashboard') && $page.url.pathname === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
					Dashboard
				</a>
				<a href="/jadwal" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
					Jadwal
				</a>
				<a href="/guru" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/guru') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
					Guru
				</a>
				<a href="/mapel" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/mapel') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
					Mapel
				</a>
				<a href="/kelas" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/kelas') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
					Kelas
				</a>
				<a href="/ruangan" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/ruangan') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
					Ruangan
				</a>
				<a href="/sesi" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/sesi') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
					Sesi
				</a>
				<a href="/tahun-ajaran" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/tahun-ajaran') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
					Tahun Ajaran
				</a>
				<a href="/sekolah" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/sekolah') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
					Sekolah
				</a>
				<a href="/pengguna" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/pengguna') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 9.197a4 4 0 11-8 0"/></svg>
					Pengguna
				</a>
				<a href="/kurikulum" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive('/kurikulum') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
					Kurikulum
				</a>
			</nav>

			<div class="p-4 border-t border-slate-200">
				<div class="flex items-center gap-3 px-3 py-2">
					<div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
						{authState.username.charAt(0).toUpperCase()}
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-slate-700 truncate">{authState.username}</p>
						<p class="text-xs text-slate-500 truncate">{authState.role}</p>
					</div>
				</div>
				<button onclick={handleLogout} class="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
					Logout
				</button>
			</div>
		</aside>

		<div class="flex-1 flex flex-col min-w-0">
			<header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 lg:hidden">
				<button onclick={() => sidebarOpen = !sidebarOpen} class="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Buka menu">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
				</button>
				<h1 class="text-lg font-bold text-slate-800">Penjadwalan</h1>
				<div class="w-10"></div>
			</header>

			<main class="flex-1">
				{@render children()}
			</main>
		</div>
	</div>

	{#if sidebarOpen}
		<div class="fixed inset-0 z-40 md:hidden" onclick={() => sidebarOpen = false} onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)} role="presentation">
			<div class="absolute inset-0 bg-black/30"></div>
		</div>
		<aside class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col md:hidden">
			<div class="h-16 flex items-center justify-between px-6 border-b border-slate-200">
				<h1 class="text-lg font-bold text-slate-800">Penjadwalan</h1>
				<button onclick={() => sidebarOpen = false} class="p-1 rounded text-slate-500 hover:bg-slate-100">&times;</button>
			</div>
			<nav class="flex-1 py-4 px-3 space-y-1">
				<a href="/dashboard" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Dashboard</a>
				<a href="/jadwal" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Jadwal</a>
				<a href="/guru" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Guru</a>
				<a href="/mapel" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Mapel</a>
				<a href="/kelas" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Kelas</a>
				<a href="/ruangan" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Ruangan</a>
				<a href="/sesi" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Sesi</a>
				<a href="/tahun-ajaran" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Tahun Ajaran</a>
				<a href="/sekolah" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Sekolah</a>
				<a href="/pengguna" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Pengguna</a>
				<a href="/kurikulum" onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Kurikulum</a>
			</nav>
			<div class="p-4 border-t border-slate-200">
				<button onclick={handleLogout} class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Logout</button>
			</div>
		</aside>
	{/if}
{/if}
