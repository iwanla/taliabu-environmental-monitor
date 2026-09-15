const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

export async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  if (cache && Date.now() < cache.expiresAt - 30_000) {
    return cache.token;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Copernicus auth failed: ${res.status}`);
  }

  const data = await res.json<{
    access_token: string;
    expires_in: number;
  }>();

  cache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cache.token;
}
