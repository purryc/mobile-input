export function snapshot(): string;
export function begin(): void;
export function stop(): void;
export function foreground(value: boolean): void;
export function sendRea(): void;
export function release(): void;
export function listHosts(): string;
export function connectHost(index: number): void;
