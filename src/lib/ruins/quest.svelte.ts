export type BatteryPlace = 'lost' | 'carry' | 'charging' | 'charged' | 'installed';

const CHARGE_SECONDS = 6;

class Quest {
	battery = $state<BatteryPlace>('lost');

	full = $state(false);
	message = $state('');

	private from: 'lost' | 'charged' = 'lost';
	private chargeStart = 0;
	installedAt = 0;
	private messageTimer: ReturnType<typeof setTimeout> | undefined;
	private chargeTimer: ReturnType<typeof setTimeout> | undefined;

	get carrying() {
		return this.battery === 'carry';
	}

	/** 充電進度 0~1，給畫面用 */
	chargeProgress(now = performance.now()) {
		if (this.battery === 'charged') return 1;
		if (this.battery !== 'charging') return 0;
		return Math.min(1, (now - this.chargeStart) / 1000 / CHARGE_SECONDS);
	}

	say(text: string) {
		this.message = text;
		clearTimeout(this.messageTimer);
		this.messageTimer = setTimeout(() => (this.message = ''), 2800);
	}

	pickFromSpot() {
		if (this.battery !== 'lost') return;
		this.battery = 'carry';
		this.full = false;
		this.from = 'lost';
		this.say('撿到一顆電池，電量是 0%');
	}

	useStation() {
		if (this.battery === 'carry') {
			if (this.full) {
				this.battery = 'charged';
				this.say('電池已經是滿的了');
				return;
			}
			this.battery = 'charging';
			this.chargeStart = performance.now();
			this.say('太陽能板還能動，開始充電…');
			clearTimeout(this.chargeTimer);
			this.chargeTimer = setTimeout(() => {
				if (this.battery !== 'charging') return;
				this.battery = 'charged';
				this.say('電池充飽了');
			}, CHARGE_SECONDS * 1000);
		} else if (this.battery === 'charging') {
			this.say(`充電中… ${Math.floor(this.chargeProgress() * 100)}%`);
		} else if (this.battery === 'charged') {
			this.battery = 'carry';
			this.full = true;
			this.from = 'charged';
			this.say('拿起充飽的電池');
		} else if (this.battery === 'installed') {
			this.say('充電座安靜地曬著月光');
		} else {
			this.say('一座太陽能充電座，指示燈還亮著');
		}
	}

	useServer() {
		if (this.battery === 'carry') {
			if (!this.full) {
				this.say('電池沒電，裝上去也沒用。先找地方充電吧');
				return;
			}
			this.battery = 'installed';
			this.installedAt = performance.now();
			this.say('電力恢復，伺服器重新啟動中…');
		} else if (this.battery === 'installed') {
			this.say('伺服器運作中');
		} else {
			this.say('電池槽是空的，備用電力只剩 3%');
		}
	}

	cancel() {
		if (this.battery !== 'carry') return;
		this.battery = this.from;
		this.say(this.from === 'lost' ? '把電池放回原處' : '把電池放回充電座');
	}
}

export const quest = new Quest();
