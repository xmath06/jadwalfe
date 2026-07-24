let nextId = $state(1);

class ToastState {
	items = $state([]);

	add(type, message, duration = 4000) {
		const id = nextId++;
		this.items.push({ id, type, message, duration });
		if (duration > 0) {
			setTimeout(() => this.remove(id), duration);
		}
		return id;
	}

	remove(id) {
		this.items = this.items.filter(t => t.id !== id);
	}

	success(message, duration) { this.add('success', message, duration); }
	error(message, duration) { this.add('error', message, duration); }
	warning(message, duration) { this.add('warning', message, duration); }
	info(message, duration) { this.add('info', message, duration); }
}

export const toastState = new ToastState();
