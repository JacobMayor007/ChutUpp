class ApiService {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async getChat(userId: string | null | undefined) {
    const res = await fetch(`${this.basePath}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!res.ok) throw new Error("Failed to fetch chat");
    return res.json();
  }

  async getProfile(userId: string) {
    const res = await fetch(`${this.basePath}/profile/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  }
}

export const api = new ApiService("http://127.0.0.1:8080");
