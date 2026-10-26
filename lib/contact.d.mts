export function handleContact(
  request: Request,
  env: {
    RESEND_API_KEY?: string;
    CONTACT_FROM_EMAIL?: string;
    NEXT_PUBLIC_META_PIXEL_ID?: string;
    META_CAPI_TOKEN?: string;
    META_TEST_EVENT_CODE?: string;
    META_GRAPH_VERSION?: string;
  },
  transport?: typeof fetch,
  timeoutMs?: number,
  schedule?: (job: () => Promise<void>) => void,
): Promise<Response>;
