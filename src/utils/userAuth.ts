class UserAuth {
    private accessToken: string | null = null;

    public setAccessToken(token: string) {
        this.accessToken = token;
    }

    public getAccessToken(): string | null {
        return this.accessToken;
    }

    public clear() {
        this.accessToken = null;
    }
}

/** SHared user settings instance */
export const userAuth = new UserAuth();
