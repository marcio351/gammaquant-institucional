/**
 * Cloudflare Pages Function — POST /api/lead
 * Recebe dados do formulario institucional e cria contato no GoHighLevel
 * via Private Integration Token (API v2).
 *
 * Secrets esperados (configurados via `wrangler pages secret put`):
 *   - GHL_TOKEN      Private Integration Token (pit-...)
 *   - GHL_LOCATION   Location ID da sub-conta (qMWeS8ncRP7nlZX0vKfe)
 */

const GHL_API = 'https://services.leadconnectorhq.com/contacts/';
const GHL_VERSION = '2021-07-28';

const PERFIL_LABELS = {
    'iniciante': 'Ainda nao invisto',
    'iniciante-bolsa': 'Invisto ha menos de 1 ano',
    'intermediario': 'Invisto entre 1 e 3 anos',
    'experiente': 'Invisto ha mais de 3 anos',
    'profissional': 'Profissional / formacao em financas',
};

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

function json(body, status, origin) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders(origin),
        },
    });
}

function normalizePhone(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
    if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
    return `+${digits}`;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

export async function onRequestOptions({ request }) {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get('Origin')),
    });
}

export async function onRequestPost({ request, env }) {
    const origin = request.headers.get('Origin');

    if (!env.GHL_TOKEN || !env.GHL_LOCATION) {
        return json({ error: 'Integracao nao configurada.' }, 500, origin);
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return json({ error: 'Payload invalido.' }, 400, origin);
    }

    const nome = String(payload.nome || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const whatsapp = String(payload.whatsapp || '').trim();
    const perfil = String(payload.perfil || '').trim();

    if (!nome || !email || !whatsapp || !perfil) {
        return json({ error: 'Campos obrigatorios ausentes.' }, 400, origin);
    }
    if (!isValidEmail(email)) {
        return json({ error: 'E-mail invalido.' }, 400, origin);
    }

    const phone = normalizePhone(whatsapp);
    const [firstName, ...rest] = nome.split(' ');
    const lastName = rest.join(' ').trim();
    const perfilLabel = PERFIL_LABELS[perfil] || perfil;

    const contactBody = {
        locationId: env.GHL_LOCATION,
        firstName: firstName || nome,
        lastName: lastName || undefined,
        name: nome,
        email,
        phone,
        source: String(payload.origem || 'site-institucional-gammaquant'),
        tags: [
            'site-institucional',
            'plataforma-gammaquant',
            `perfil-${perfil}`,
        ],
        customField: {},
    };

    try {
        const ghlRes = await fetch(GHL_API, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.GHL_TOKEN}`,
                Version: GHL_VERSION,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(contactBody),
        });

        const text = await ghlRes.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }

        if (!ghlRes.ok) {
            const alreadyExists = ghlRes.status === 400 && /duplicat/i.test(text);
            if (alreadyExists) {
                return json({
                    ok: true,
                    status: 'duplicate',
                    message: 'Contato ja existia no CRM.',
                    perfil: perfilLabel,
                }, 200, origin);
            }
            return json({
                error: 'Falha ao criar contato no CRM.',
                upstream_status: ghlRes.status,
                upstream_body: data,
            }, 502, origin);
        }

        return json({
            ok: true,
            status: 'created',
            contactId: data?.contact?.id || data?.id || null,
            perfil: perfilLabel,
        }, 200, origin);
    } catch (err) {
        return json({
            error: 'Erro inesperado ao contatar o CRM.',
            detail: String(err?.message || err),
        }, 500, origin);
    }
}

export async function onRequest({ request }) {
    if (request.method === 'OPTIONS') return onRequestOptions({ request });
    return json({ error: 'Metodo nao permitido.' }, 405, request.headers.get('Origin'));
}
