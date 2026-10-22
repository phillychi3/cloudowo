import { quest } from '$lib/ruins/quest.svelte';

export type Era = 'ruins' | 'modern';
export type Sweep = { dir: 'forward' | 'back'; start: number; ms: number };

// 與 app.html 的內嵌腳本共用同一個 key，首屏才不會閃一下廢墟
const KEY = 'cloudowo:era';

class EraState {
	current = $state<Era>('ruins');
	warping = $state<false | 'forward' | 'back'>(false);
	/** 背景重建的掃描線，由城市畫布每幀讀取，不需要響應式 */
	sweep: Sweep | null = null;

	startSweep(dir: Sweep['dir'], ms: number) {
		this.sweep = { dir, start: performance.now(), ms };
	}

	endSweep() {
		this.sweep = null;
	}

	load() {
		try {
			if (localStorage.getItem(KEY) === 'modern') this.set('modern');
		} catch {
			/* 無痕模式等情況讀不到就維持廢墟 */
		}
	}

	private set(era: Era) {
		this.current = era;
		document.documentElement.dataset.era = era;
		try {
			if (era === 'modern') localStorage.setItem(KEY, era);
			else localStorage.removeItem(KEY);
		} catch {
			/* 存不了就只在這次瀏覽有效 */
		}
	}

	travel() {
		if (this.warping || this.current === 'modern') return;
		this.warping = 'forward';
	}

	goBack() {
		if (this.warping || this.current === 'ruins') return;
		this.warping = 'back';
	}

	/** 由轉場動畫在畫面全遮住時呼叫 */
	swap() {
		if (this.warping === 'forward') this.set('modern');
		else {
			quest.reset();
			this.set('ruins');
		}
	}

	done() {
		this.warping = false;
	}
}

export const era = new EraState();
