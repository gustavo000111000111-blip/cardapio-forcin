export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    const { itens } = req.body;

    const body = {
        items: itens,
        back_urls: {
            success: "https://forcin.vercel.app/",
            failure: "https://forcin.vercel.app/",
            pending: "https://forcin.vercel.app/"
        },
        auto_return: "approved",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    res.status(200).json({ url: data.init_point });
}