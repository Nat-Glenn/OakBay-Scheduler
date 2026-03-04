let pendingMfa = null;

export function setPendingMfa(data) {
  pendingMfa = data;
}

export function getPendingMfa() {
  return pendingMfa;
}

export function clearPendingMfa() {
  pendingMfa = null;
}