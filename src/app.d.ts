// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            user: {
                id: string;
                username: string;
                service: `beatleader` | `beatsaver` | `judgeId`;
                isVerified?: boolean;
            }
        }
        interface PageData {
            pageMetadata?: {
                title?: string;
                description?: string;
                imageUrl?: string;
            };
            pageData?: any; // This can be used to pass any additional data to the page
        }

        // interface PageState {}
        // interface Platform {}
    }
}

export { };
