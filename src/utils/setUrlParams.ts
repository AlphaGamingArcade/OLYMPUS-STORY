export function setUrlParams(key: string, value: string) {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(window.history.state, '', url.toString());
}

export function deleteUrlParams(key: string) {
    const url = new URL(window.location.href);
    url.searchParams.delete(key);
    window.history.replaceState(window.history.state, '', url.toString());
}
