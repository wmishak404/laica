type HostEnv = Partial<Record<string, string>>;

function addCsvHosts(hosts: Set<string>, rawValue?: string): void {
  if (!rawValue) {
    return;
  }

  for (const host of rawValue.split(",")) {
    const normalized = normalizeAllowedHost(host);
    if (normalized) {
      hosts.add(normalized);
    }
  }
}

export function normalizeAllowedHost(rawHost: string): string | null {
  let value = rawHost.trim();

  if (!value || value === "*") {
    return null;
  }

  if (value.startsWith(".")) {
    return value.toLowerCase();
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value)) {
    try {
      value = new URL(value).hostname;
    } catch {
      return null;
    }
  } else {
    value = value.split("/")[0].split(":")[0];
  }

  return value ? value.toLowerCase() : null;
}

export function getViteAllowedHosts(env: HostEnv = process.env): string[] {
  const hosts = new Set<string>();

  addCsvHosts(hosts, env.REPLIT_DOMAINS);
  addCsvHosts(hosts, env.REPLIT_DEV_DOMAIN);
  addCsvHosts(hosts, env.LAICA_DEV_ALLOWED_HOSTS);
  addCsvHosts(hosts, env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS);

  if (env.REPL_ID) {
    hosts.add(".replit.dev");
    hosts.add(".replit.app");
    hosts.add(".repl.co");
  }

  return Array.from(hosts);
}
