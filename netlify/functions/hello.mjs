export default async (req, context) => {
    const body = {
        ok: true,
        message: "Hello from cleaning-chatbot",
        time: new Date().toISOString(),
    };

    return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    });
};
export const config = {
    path: "/api/hello",
};